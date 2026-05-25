import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MathText, autoWrapMath } from '../App';

describe('MathText React Component', () => {
  const originalKatex = (globalThis as any).katex;

  beforeEach(() => {
    // Mock the global katex library
    (globalThis as any).katex = {
      renderToString: vi.fn((math: string, options?: any) => {
        const displayMode = options?.displayMode ? 'block' : 'inline';
        return `<mock-katex mode="${displayMode}">${math}</mock-katex>`;
      })
    };
    (globalThis as any).window = globalThis;
  });

  afterEach(() => {
    (globalThis as any).katex = originalKatex;
    vi.restoreAllMocks();
  });

  it('should return null if text is empty or missing', () => {
    const el1 = MathText({ text: '' });
    expect(el1).toBeNull();
  });

  it('should render plain text without math delimiters', () => {
    const el = MathText({ text: 'This is plain text with no equations.' }) as any;
    expect(el).not.toBeNull();
    
    // Check that it returns a span with the correct class/style
    const props = el.props;
    expect(props.className).toBeUndefined();
    
    // The children should be a list containing the single text span
    const children = props.children as any[];
    expect(children).toBeInstanceOf(Array);
    expect(children).toHaveLength(1);
    expect(children[0].props.children).toBe('This is plain text with no equations.');
  });

  it('should render inline math correctly using katex.renderToString', () => {
    const el = MathText({ text: '$x = y + 1$' }) as any;
    expect(el).not.toBeNull();
    
    const children = el.props.children as any[];
    expect(children).toHaveLength(1);
    
    const mathSpan = children[0];
    expect(mathSpan.props.className).toBe('math-inline-wrapper');
    expect(mathSpan.props.dangerouslySetInnerHTML.__html).toBe(
      '<mock-katex mode="inline">x = y + 1</mock-katex>'
    );
    expect((globalThis as any).katex.renderToString).toHaveBeenCalledWith('x = y + 1', {
      displayMode: false,
      throwOnError: false
    });
  });

  it('should render block math correctly using katex.renderToString', () => {
    const el = MathText({ text: '$$\\int_a^b f(x)dx$$' }) as any;
    expect(el).not.toBeNull();
    
    const children = el.props.children as any[];
    expect(children).toHaveLength(1);
    
    const mathSpan = children[0];
    expect(mathSpan.props.className).toBe('math-block-wrapper');
    expect(mathSpan.props.dangerouslySetInnerHTML.__html).toBe(
      '<mock-katex mode="block">\\int_a^b f(x)dx</mock-katex>'
    );
    expect((globalThis as any).katex.renderToString).toHaveBeenCalledWith('\\int_a^b f(x)dx', {
      displayMode: true,
      throwOnError: false
    });
  });

  it('should split and render mixed text containing plain text, inline, and block math', () => {
    const el = MathText({ text: 'Calculate the value of $x$ when the equation is $$3x^2 - 12x + 9 = 0$$ is given.' }) as any;
    expect(el).not.toBeNull();
    
    const children = el.props.children as any[];
    expect(children).toHaveLength(5);
    
    // Part 1: Plain text
    expect(children[0].props.children).toBe('Calculate the value of ');
    
    // Part 2: Inline math $x$
    expect(children[1].props.className).toBe('math-inline-wrapper');
    expect(children[1].props.dangerouslySetInnerHTML.__html).toBe(
      '<mock-katex mode="inline">x</mock-katex>'
    );
    
    // Part 3: Plain text
    expect(children[2].props.children).toBe(' when the equation is ');
    
    // Part 4: Block math $$3x^2 - 12x + 9 = 0$$
    expect(children[3].props.className).toBe('math-block-wrapper');
    expect(children[3].props.dangerouslySetInnerHTML.__html).toBe(
      '<mock-katex mode="block">3x^2 - 12x + 9 = 0</mock-katex>'
    );
    
    // Part 5: Plain text
    expect(children[4].props.children).toBe(' is given.');
  });

  it('should fallback to rendering raw math strings if katex library is missing', () => {
    // Delete katex from global object
    delete (globalThis as any).katex;

    const el = MathText({ text: 'Equation $a^2 + b^2 = c^2$' }) as any;
    expect(el).not.toBeNull();
    
    const children = el.props.children as any[];
    expect(children).toHaveLength(2);
    
    // Part 1: Plain text
    expect(children[0].props.children).toBe('Equation ');
    
    // Part 2: Math fallback should render raw equation inside the wrapper
    expect(children[1].props.className).toBe('math-inline-wrapper');
    expect(children[1].props.dangerouslySetInnerHTML.__html).toBe('a^2 + b^2 = c^2');
    
    // Check block fallback
    const elBlock = MathText({ text: '$$E = mc^2$$' }) as any;
    const blockChildren = elBlock.props.children as any[];
    expect(blockChildren[0].props.className).toBe('math-block-wrapper');
    expect(blockChildren[0].props.dangerouslySetInnerHTML.__html).toBe('E = mc^2');
  });

  it('should handle rendering errors inside renderToString gracefully by returning raw delimiters', () => {
    // Make renderToString throw an error
    (globalThis as any).katex.renderToString.mockImplementation(() => {
      throw new Error('KaTeX parsing error');
    });

    const el = MathText({ text: 'Invalid math $a \\invalid$' }) as any;
    expect(el).not.toBeNull();
    
    const children = el.props.children as any[];
    expect(children).toHaveLength(2);
    
    // When errored, it should fall back to standard text nodes showing the raw input with delimiters
    expect(children[1].props.children).toBe('$a \\invalid$');
  });
});

describe('autoWrapMath utility function', () => {
  it('should not modify text that already contains math delimiters', () => {
    expect(autoWrapMath('This has $x^2$ already.')).toBe('This has $x^2$ already.');
    expect(autoWrapMath('$$E = mc^2$$')).toBe('$$E = mc^2$$');
  });

  it('should wrap a complete string if it is standard set notation with escaped braces', () => {
    expect(autoWrapMath('\\{a-b, 0\\}')).toBe('$\\{a-b, 0\\}$');
    expect(autoWrapMath('\\{\\frac{a}{b}, 0\\}')).toBe('$\\{\\frac{a}{b}, 0\\}$');
  });

  it('should wrap inline Greek letters like \\alpha and \\beta', () => {
    expect(autoWrapMath('If \\alpha & \\beta are roots')).toBe('If $\\alpha$ & $\\beta$ are roots');
  });

  it('should wrap equations like x^2 - 13x + 8 = 0', () => {
    expect(autoWrapMath('Solve x^2 - 13x + 8 = 0 for x')).toBe('Solve $x^2 - 13x + 8 = 0$ for x');
  });

  it('should wrap single variables with exponents like x^2 or \\alpha^4', () => {
    expect(autoWrapMath('value of \\alpha^4 + \\beta^4 = ______')).toBe('value of $\\alpha^4$ + $\\beta^4$ = ______');
    expect(autoWrapMath('when x^2 is positive')).toBe('when $x^2$ is positive');
  });
});
