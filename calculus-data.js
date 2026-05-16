// Calculus course — standard Calc 1 + into Calc 2.
const CALCULUS_COURSE = {
  id: "calculus",
  title: "Calculus",
  subtitle: "Limits, derivatives, integrals, and their applications",
  emoji: "∫",
  accent: "#7f1d1d",
  accent2: "#c98a8a",
  description: "Nine topics from limits through derivatives, integrals, and series.",
  books: [
    {
      id: "c1", num: 1, title: "Limits & Continuity", subtitle: "The foundation of calculus",
      emoji: "🎯", accent: "#7f1d1d", accent2: "#c98a8a",
      sections: [
        {
          title: "Evaluating Limits",
          questions: [
            { type: "regular", q: "\\(\\lim_{x \\to 5}(2x - 3)\\)?", answer: "7.", solution: "Direct substitution." },
            { type: "regular", q: "\\(\\lim_{x \\to 2}\\dfrac{x^2 - 4}{x - 2}\\)?", answer: "4.", solution: "Factor: \\(x + 2\\) at \\(x = 2\\)." },
            { type: "regular", q: "\\(\\lim_{x \\to 0}\\dfrac{\\sin x}{x}\\)?", answer: "1.", solution: "Classic trig limit." },
            { type: "regular", q: "\\(\\lim_{x \\to 0}\\dfrac{1 - \\cos x}{x}\\)?", answer: "0.", solution: "Another standard limit." },
            { type: "word", q: "Evaluate \\(\\lim_{x \\to 3}\\dfrac{x^2 - 9}{x - 3}\\).", answer: "6.", solution: "Factor: \\(x + 3\\) at 3." }
          ]
        },
        {
          title: "Limits at Infinity",
          questions: [
            { type: "regular", q: "\\(\\lim_{x \\to \\infty}\\dfrac{3x^2 + 1}{x^2 - 2}\\)?", answer: "3.", solution: "Ratio of leading coefficients." },
            { type: "regular", q: "\\(\\lim_{x \\to \\infty}\\dfrac{x}{x^2 + 1}\\)?", answer: "0.", solution: "Bottom degree higher." },
            { type: "regular", q: "\\(\\lim_{x \\to \\infty}\\dfrac{x^3}{x^2}\\)?", answer: "\\(+\\infty\\).", solution: "Top degree higher, positive." },
            { type: "regular", q: "\\(\\lim_{x \\to -\\infty}e^x\\)?", answer: "0.", solution: "Exponential decays to 0." },
            { type: "word", q: "Horizontal asymptote of \\(f(x) = \\dfrac{2x^2}{x^2 + 4}\\)?", answer: "\\(y = 2\\).", solution: "Limit at infinity." }
          ]
        },
        {
          title: "Continuity",
          questions: [
            { type: "regular", q: "Three conditions for continuity at \\(x = a\\)?", answer: "\\(f(a)\\) defined; \\(\\lim_{x\\to a}f(x)\\) exists; they are equal.", solution: "Standard definition." },
            { type: "regular", q: "Is \\(f(x) = |x|\\) continuous at 0?", answer: "Yes.", solution: "All three conditions hold." },
            { type: "regular", q: "Is \\(f(x) = 1/x\\) continuous at 0?", answer: "No (undefined at 0).", solution: "Not in domain." },
            { type: "regular", q: "Does \\(\\lim_{x \\to 0}\\dfrac{|x|}{x}\\) exist?", answer: "No.", solution: "Left and right limits differ." },
            { type: "word", q: "Piecewise: \\(f(x) = x^2\\) for \\(x < 1\\); \\(f(x) = 3x - 2\\) for \\(x \\geq 1\\). Continuous at 1?", answer: "Yes.", solution: "Both sides give 1." }
          ]
        }
      ],
      cumulativeTest: {
        title: "Cumulative Test — Limits & Continuity",
        questions: [
          { type: "regular", q: "\\(\\lim_{x \\to 1}(x^3 + 2)\\)?", answer: "3.", solution: "Substitute." },
          { type: "regular", q: "\\(\\lim_{x \\to \\infty}\\dfrac{5}{x^2}\\)?", answer: "0.", solution: "Goes to 0." },
          { type: "regular", q: "Is \\(f(x) = x^2\\) continuous everywhere?", answer: "Yes.", solution: "Polynomials are continuous." },
          { type: "regular", q: "\\(\\lim_{x \\to 0}\\dfrac{\\tan x}{x}\\)?", answer: "1.", solution: "\\(\\dfrac{\\sin x}{x} \\cdot \\dfrac{1}{\\cos x}\\)." },
          { type: "word", q: "\\(\\lim_{x \\to 4}\\dfrac{x^2 - 16}{x - 4}\\)?", answer: "8.", solution: "Factor: \\(x + 4\\)." },
          { type: "word", q: "Is \\(f(x) = \\dfrac{x^2 - 1}{x - 1}\\) continuous at \\(x = 1\\)?", answer: "No — undefined (removable discontinuity).", solution: "Denominator zero." }
        ]
      }
    },
    {
      id: "c2", num: 2, title: "Derivatives: Basics", subtitle: "Definition and power rule",
      emoji: "📉", accent: "#b91c1c", accent2: "#e28585",
      sections: [
        {
          title: "Definition & Tangent Lines",
          questions: [
            { type: "regular", q: "Definition of \\(f'(x)\\)?", answer: "\\(\\lim_{h \\to 0}\\dfrac{f(x+h) - f(x)}{h}\\).", solution: "Limit of difference quotient." },
            { type: "regular", q: "Find \\(f'(x)\\) for \\(f(x) = x^2\\) using the definition.", answer: "\\(2x\\).", solution: "Expand \\((x+h)^2\\), simplify, take limit." },
            { type: "regular", q: "Slope of tangent to \\(f(x) = x^2\\) at \\(x = 3\\)?", answer: "6.", solution: "\\(f'(3) = 2 \\cdot 3\\)." },
            { type: "regular", q: "Equation of tangent to \\(y = x^2\\) at \\((2, 4)\\)?", answer: "\\(y = 4x - 4\\).", solution: "Slope 4, point-slope." },
            { type: "word", q: "A position function \\(s(t) = t^2\\). Instantaneous velocity at \\(t = 5\\)?", answer: "10.", solution: "\\(s'(5) = 10\\)." }
          ]
        },
        {
          title: "Power Rule & Basic Derivatives",
          questions: [
            { type: "regular", q: "\\(\\dfrac{d}{dx}(x^5)\\)?", answer: "\\(5x^4\\).", solution: "Power rule." },
            { type: "regular", q: "\\(\\dfrac{d}{dx}(3x^2 - 7x + 4)\\)?", answer: "\\(6x - 7\\).", solution: "Term by term." },
            { type: "regular", q: "Derivative of a constant?", answer: "0.", solution: "Flat line." },
            { type: "regular", q: "\\(\\dfrac{d}{dx}(\\sqrt{x})\\)?", answer: "\\(\\dfrac{1}{2\\sqrt{x}}\\).", solution: "\\(x^{1/2}\\); use power rule." },
            { type: "word", q: "Find \\(f'(x)\\) if \\(f(x) = 4x^3 - 2x + 1\\).", answer: "\\(12x^2 - 2\\).", solution: "Power rule per term." }
          ]
        },
        {
          title: "Trig and Exponential Derivatives",
          questions: [
            { type: "regular", q: "\\(\\dfrac{d}{dx}(\\sin x)\\)?", answer: "\\(\\cos x\\).", solution: "Standard derivative." },
            { type: "regular", q: "\\(\\dfrac{d}{dx}(\\cos x)\\)?", answer: "\\(-\\sin x\\).", solution: "Standard derivative." },
            { type: "regular", q: "\\(\\dfrac{d}{dx}(e^x)\\)?", answer: "\\(e^x\\).", solution: "Exponential is its own derivative." },
            { type: "regular", q: "\\(\\dfrac{d}{dx}(\\ln x)\\)?", answer: "\\(\\dfrac{1}{x}\\).", solution: "Standard derivative." },
            { type: "word", q: "Find \\(\\dfrac{d}{dx}(2\\sin x + 3\\cos x)\\).", answer: "\\(2\\cos x - 3\\sin x\\).", solution: "Linearity." }
          ]
        }
      ],
      cumulativeTest: {
        title: "Cumulative Test — Derivatives: Basics",
        questions: [
          { type: "regular", q: "\\(\\dfrac{d}{dx}(x^{10})\\)?", answer: "\\(10x^9\\).", solution: "Power rule." },
          { type: "regular", q: "\\(\\dfrac{d}{dx}(7)\\)?", answer: "0.", solution: "Constant." },
          { type: "regular", q: "\\(\\dfrac{d}{dx}(e^x + \\sin x)\\)?", answer: "\\(e^x + \\cos x\\).", solution: "Linearity." },
          { type: "regular", q: "Slope of tangent to \\(y = x^3\\) at \\(x = 2\\)?", answer: "12.", solution: "\\(3x^2\\) at 2." },
          { type: "word", q: "Velocity if \\(s(t) = 5t^2\\) at \\(t = 3\\)?", answer: "30.", solution: "\\(10t\\) at 3." },
          { type: "word", q: "Tangent line slope to \\(y = \\ln x\\) at \\(x = e\\)?", answer: "\\(\\dfrac{1}{e}\\).", solution: "\\(1/x\\) at \\(e\\)." }
        ]
      }
    },
    {
      id: "c3", num: 3, title: "Derivative Rules", subtitle: "Product, quotient, chain",
      emoji: "🔗", accent: "#c2410c", accent2: "#e8a481",
      sections: [
        {
          title: "Product Rule",
          questions: [
            { type: "regular", q: "State the product rule.", answer: "\\((fg)' = f'g + fg'\\).", solution: "Standard." },
            { type: "regular", q: "\\(\\dfrac{d}{dx}(x^2 \\sin x)\\)?", answer: "\\(2x\\sin x + x^2\\cos x\\).", solution: "Product rule." },
            { type: "regular", q: "\\(\\dfrac{d}{dx}(x e^x)\\)?", answer: "\\(e^x(1 + x)\\).", solution: "\\(1 \\cdot e^x + x \\cdot e^x\\)." },
            { type: "regular", q: "\\(\\dfrac{d}{dx}((x+1)(x-2))\\)?", answer: "\\(2x - 1\\).", solution: "Product rule or expand first." },
            { type: "word", q: "Find \\(\\dfrac{d}{dx}(x^3 \\cos x)\\).", answer: "\\(3x^2\\cos x - x^3\\sin x\\).", solution: "Product rule." }
          ]
        },
        {
          title: "Quotient Rule",
          questions: [
            { type: "regular", q: "State the quotient rule.", answer: "\\(\\left(\\dfrac{f}{g}\\right)' = \\dfrac{f'g - fg'}{g^2}\\).", solution: "Standard." },
            { type: "regular", q: "\\(\\dfrac{d}{dx}\\left(\\dfrac{x}{x+1}\\right)\\)?", answer: "\\(\\dfrac{1}{(x+1)^2}\\).", solution: "\\((1(x+1) - x(1))/(x+1)^2\\)." },
            { type: "regular", q: "\\(\\dfrac{d}{dx}(\\tan x)\\)?", answer: "\\(\\sec^2 x\\).", solution: "Quotient rule on \\(\\sin/\\cos\\)." },
            { type: "regular", q: "\\(\\dfrac{d}{dx}\\left(\\dfrac{x^2}{x+3}\\right)\\)?", answer: "\\(\\dfrac{x^2 + 6x}{(x+3)^2}\\).", solution: "Quotient rule." },
            { type: "word", q: "\\(\\dfrac{d}{dx}\\left(\\dfrac{\\sin x}{x}\\right)\\)?", answer: "\\(\\dfrac{x\\cos x - \\sin x}{x^2}\\).", solution: "Quotient rule." }
          ]
        },
        {
          title: "Chain Rule",
          questions: [
            { type: "regular", q: "State the chain rule.", answer: "\\((f(g(x)))' = f'(g(x)) \\cdot g'(x)\\).", solution: "Composition rule." },
            { type: "regular", q: "\\(\\dfrac{d}{dx}(\\sin(3x))\\)?", answer: "\\(3\\cos(3x)\\).", solution: "Chain rule." },
            { type: "regular", q: "\\(\\dfrac{d}{dx}((x^2 + 1)^5)\\)?", answer: "\\(10x(x^2 + 1)^4\\).", solution: "Chain rule." },
            { type: "regular", q: "\\(\\dfrac{d}{dx}(e^{2x})\\)?", answer: "\\(2e^{2x}\\).", solution: "Chain rule." },
            { type: "word", q: "\\(\\dfrac{d}{dx}(\\cos(x^2))\\)?", answer: "\\(-2x\\sin(x^2)\\).", solution: "Chain rule." }
          ]
        }
      ],
      cumulativeTest: {
        title: "Cumulative Test — Derivative Rules",
        questions: [
          { type: "regular", q: "\\(\\dfrac{d}{dx}(x^2 e^x)\\)?", answer: "\\(e^x(x^2 + 2x)\\).", solution: "Product rule." },
          { type: "regular", q: "\\(\\dfrac{d}{dx}\\left(\\dfrac{1}{x^2}\\right)\\)?", answer: "\\(-\\dfrac{2}{x^3}\\).", solution: "Rewrite as \\(x^{-2}\\)." },
          { type: "regular", q: "\\(\\dfrac{d}{dx}(\\sin^2 x)\\)?", answer: "\\(2\\sin x\\cos x\\).", solution: "Chain rule." },
          { type: "regular", q: "\\(\\dfrac{d}{dx}(\\ln(2x))\\)?", answer: "\\(\\dfrac{1}{x}\\).", solution: "Chain rule: \\(\\dfrac{2}{2x}\\)." },
          { type: "word", q: "\\(\\dfrac{d}{dx}\\left(\\dfrac{\\cos x}{x}\\right)\\)?", answer: "\\(\\dfrac{-x\\sin x - \\cos x}{x^2}\\).", solution: "Quotient rule." },
          { type: "word", q: "\\(\\dfrac{d}{dx}(\\sqrt{x^2 + 1})\\)?", answer: "\\(\\dfrac{x}{\\sqrt{x^2 + 1}}\\).", solution: "Chain rule." }
        ]
      }
    },
    {
      id: "c4", num: 4, title: "Applications of Derivatives", subtitle: "Max/min, related rates",
      emoji: "📈", accent: "#a16207", accent2: "#d8b17a",
      sections: [
        {
          title: "Critical Points & Extrema",
          questions: [
            { type: "regular", q: "Where are critical points of \\(f(x) = x^3 - 3x\\)?", answer: "\\(x = \\pm 1\\).", solution: "\\(f' = 3x^2 - 3 = 0\\)." },
            { type: "regular", q: "Classify \\(x = 1\\) for \\(f(x) = x^3 - 3x\\) (min/max)?", answer: "Local min.", solution: "\\(f''(1) = 6 > 0\\)." },
            { type: "regular", q: "Max of \\(f(x) = -x^2 + 4x\\) on all reals?", answer: "4 at \\(x = 2\\).", solution: "Vertex." },
            { type: "regular", q: "Where is \\(f(x) = x^3\\) increasing?", answer: "Everywhere.", solution: "\\(f'(x) = 3x^2 \\geq 0\\)." },
            { type: "word", q: "Absolute min of \\(f(x) = x^2 - 4x\\) on \\([0, 5]\\)?", answer: "\\(-4\\) at \\(x = 2\\).", solution: "Vertex is inside interval." }
          ]
        },
        {
          title: "Concavity & Inflection",
          questions: [
            { type: "regular", q: "Where is \\(f(x) = x^3\\) concave up?", answer: "\\(x > 0\\).", solution: "\\(f''(x) = 6x > 0\\) for \\(x > 0\\)." },
            { type: "regular", q: "Inflection point of \\(f(x) = x^3\\)?", answer: "\\(x = 0\\).", solution: "Concavity changes." },
            { type: "regular", q: "If \\(f''(a) < 0\\) and \\(f'(a) = 0\\), what is \\(x = a\\)?", answer: "Local max.", solution: "Second derivative test." },
            { type: "regular", q: "Is \\(f(x) = e^x\\) always concave up?", answer: "Yes.", solution: "\\(f'' = e^x > 0\\)." },
            { type: "word", q: "Find the inflection point of \\(f(x) = x^3 - 6x^2\\).", answer: "\\(x = 2\\).", solution: "\\(f''(x) = 6x - 12 = 0\\)." }
          ]
        },
        {
          title: "Related Rates & Optimization",
          questions: [
            { type: "regular", q: "To maximize area of a rectangle with fixed perimeter, it should be a...?", answer: "Square.", solution: "Classic optimization." },
            { type: "regular", q: "If \\(V = \\tfrac{4}{3}\\pi r^3\\), find \\(\\dfrac{dV}{dr}\\).", answer: "\\(4\\pi r^2\\).", solution: "Derivative (matches surface area)." },
            { type: "regular", q: "Radius of a sphere grows at 2 cm/s. At \\(r = 5\\), \\(\\dfrac{dV}{dt}\\)?", answer: "\\(200\\pi\\) cm³/s.", solution: "\\(4\\pi r^2 \\cdot dr/dt = 4\\pi(25)(2)\\)." },
            { type: "regular", q: "Rectangle with perimeter 20: max area?", answer: "25 (a 5×5 square).", solution: "Optimize \\(A = x(10 - x)\\)." },
            { type: "word", q: "A ladder 10 ft long slides down a wall. Base moves out at 2 ft/s. When base is 6 ft from wall, how fast is top moving down?", answer: "1.5 ft/s.", solution: "\\(x^2 + y^2 = 100\\); \\(x = 6, y = 8\\); \\(6(2) + 8(dy/dt) = 0\\)." }
          ]
        }
      ],
      cumulativeTest: {
        title: "Cumulative Test — Applications of Derivatives",
        questions: [
          { type: "regular", q: "Critical points of \\(f(x) = x^2 - 4x\\)?", answer: "\\(x = 2\\).", solution: "\\(f' = 2x - 4 = 0\\)." },
          { type: "regular", q: "Inflection of \\(f(x) = x^3 - 3x^2\\)?", answer: "\\(x = 1\\).", solution: "\\(f'' = 6x - 6\\)." },
          { type: "regular", q: "Is \\(f(x) = -x^2\\) concave up or down?", answer: "Down.", solution: "\\(f''(x) = -2 < 0\\)." },
          { type: "regular", q: "Max of \\(f(x) = 6x - x^2\\)?", answer: "9 at \\(x = 3\\).", solution: "Vertex." },
          { type: "word", q: "A box has square base and open top, volume 32. Minimize surface area's base side?", answer: "\\(s = 4\\).", solution: "\\(V = s^2 h = 32\\); \\(S = s^2 + 4sh\\); optimize." },
          { type: "word", q: "Spherical balloon inflates at \\(\\tfrac{dV}{dt} = 36\\pi\\). At \\(r = 3\\), how fast is \\(r\\) changing?", answer: "1.", solution: "\\(36\\pi = 4\\pi(9)(dr/dt)\\)." }
        ]
      }
    },
    {
      id: "c5", num: 5, title: "Integrals: Basics", subtitle: "Antiderivatives and the FTC",
      emoji: "∫", accent: "#65a30d", accent2: "#a8d577",
      sections: [
        {
          title: "Antiderivatives",
          questions: [
            { type: "regular", q: "\\(\\int x\\,dx\\)?", answer: "\\(\\dfrac{x^2}{2} + C\\).", solution: "Reverse power rule." },
            { type: "regular", q: "\\(\\int 3x^2\\,dx\\)?", answer: "\\(x^3 + C\\).", solution: "Reverse power rule." },
            { type: "regular", q: "\\(\\int \\cos x\\,dx\\)?", answer: "\\(\\sin x + C\\).", solution: "Standard." },
            { type: "regular", q: "\\(\\int e^x\\,dx\\)?", answer: "\\(e^x + C\\).", solution: "Standard." },
            { type: "word", q: "\\(\\int \\dfrac{1}{x}\\,dx\\)?", answer: "\\(\\ln|x| + C\\).", solution: "Standard." }
          ]
        },
        {
          title: "Definite Integrals",
          questions: [
            { type: "regular", q: "\\(\\int_0^1 x\\,dx\\)?", answer: "\\(\\tfrac{1}{2}\\).", solution: "\\(\\tfrac{x^2}{2}\\) from 0 to 1." },
            { type: "regular", q: "\\(\\int_0^{\\pi}\\sin x\\,dx\\)?", answer: "2.", solution: "\\([-\\cos x]_0^\\pi = 1 + 1\\)." },
            { type: "regular", q: "\\(\\int_1^2 (2x + 1)\\,dx\\)?", answer: "4.", solution: "\\(x^2 + x\\) from 1 to 2 = \\(6 - 2\\)." },
            { type: "regular", q: "What does \\(\\int_a^b f(x)\\,dx\\) represent geometrically?", answer: "Signed area under \\(f\\) from \\(a\\) to \\(b\\).", solution: "Riemann sum." },
            { type: "word", q: "\\(\\int_0^3 x^2\\,dx\\)?", answer: "9.", solution: "\\(\\tfrac{x^3}{3}\\) from 0 to 3." }
          ]
        },
        {
          title: "Fundamental Theorem of Calculus",
          questions: [
            { type: "regular", q: "FTC Part 1: what does \\(\\dfrac{d}{dx}\\int_a^x f(t)\\,dt\\) equal?", answer: "\\(f(x)\\).", solution: "Derivative of an integral." },
            { type: "regular", q: "FTC Part 2: \\(\\int_a^b f(x)\\,dx = ?\\)", answer: "\\(F(b) - F(a)\\) where \\(F' = f\\).", solution: "Evaluation theorem." },
            { type: "regular", q: "\\(\\int_{-1}^{1} x^3\\,dx\\)?", answer: "0.", solution: "Odd function on symmetric interval." },
            { type: "regular", q: "\\(\\int_0^{\\pi/2}\\cos x\\,dx\\)?", answer: "1.", solution: "\\([\\sin x]_0^{\\pi/2}\\)." },
            { type: "word", q: "If \\(f(x) = \\int_0^x \\sin t\\,dt\\), find \\(f'(\\pi/2)\\).", answer: "1.", solution: "FTC 1: \\(f'(x) = \\sin x\\)." }
          ]
        }
      ],
      cumulativeTest: {
        title: "Cumulative Test — Integrals: Basics",
        questions: [
          { type: "regular", q: "\\(\\int 5x^4\\,dx\\)?", answer: "\\(x^5 + C\\).", solution: "Reverse power rule." },
          { type: "regular", q: "\\(\\int_0^2 x\\,dx\\)?", answer: "2.", solution: "\\(\\tfrac{4}{2}\\)." },
          { type: "regular", q: "\\(\\int \\sin x\\,dx\\)?", answer: "\\(-\\cos x + C\\).", solution: "Standard." },
          { type: "regular", q: "\\(\\int_1^e \\dfrac{1}{x}\\,dx\\)?", answer: "1.", solution: "\\(\\ln e - \\ln 1\\)." },
          { type: "word", q: "Area under \\(y = x^2\\) from 0 to 2?", answer: "\\(\\tfrac{8}{3}\\).", solution: "\\(\\int_0^2 x^2\\,dx\\)." },
          { type: "word", q: "\\(\\int_0^\\pi \\cos x\\,dx\\)?", answer: "0.", solution: "\\(\\sin\\pi - \\sin 0\\)." }
        ]
      }
    },
    {
      id: "c6", num: 6, title: "Integration Techniques", subtitle: "u-substitution and more",
      emoji: "🔧", accent: "#0369a1", accent2: "#75b7d7",
      sections: [
        {
          title: "u-Substitution",
          questions: [
            { type: "regular", q: "\\(\\int 2x \\cos(x^2)\\,dx\\)?", answer: "\\(\\sin(x^2) + C\\).", solution: "Let \\(u = x^2\\)." },
            { type: "regular", q: "\\(\\int (2x + 1)^5\\,dx\\)?", answer: "\\(\\dfrac{(2x+1)^6}{12} + C\\).", solution: "\\(u = 2x+1\\)." },
            { type: "regular", q: "\\(\\int \\dfrac{1}{x\\ln x}\\,dx\\)?", answer: "\\(\\ln|\\ln x| + C\\).", solution: "\\(u = \\ln x\\)." },
            { type: "regular", q: "\\(\\int x e^{x^2}\\,dx\\)?", answer: "\\(\\tfrac{1}{2}e^{x^2} + C\\).", solution: "\\(u = x^2\\)." },
            { type: "word", q: "\\(\\int_0^1 2x(x^2+1)^3\\,dx\\)?", answer: "\\(\\tfrac{15}{4}\\).", solution: "\\(u = x^2+1\\); limits 1 to 2." }
          ]
        },
        {
          title: "Integration by Parts",
          questions: [
            { type: "regular", q: "State integration by parts.", answer: "\\(\\int u\\,dv = uv - \\int v\\,du\\).", solution: "Product-rule-in-reverse." },
            { type: "regular", q: "\\(\\int x e^x\\,dx\\)?", answer: "\\(e^x(x - 1) + C\\).", solution: "\\(u = x, dv = e^x dx\\)." },
            { type: "regular", q: "\\(\\int x \\cos x\\,dx\\)?", answer: "\\(x\\sin x + \\cos x + C\\).", solution: "Parts." },
            { type: "regular", q: "\\(\\int \\ln x\\,dx\\)?", answer: "\\(x\\ln x - x + C\\).", solution: "\\(u = \\ln x, dv = dx\\)." },
            { type: "word", q: "Evaluate \\(\\int x \\sin x\\,dx\\).", answer: "\\(-x\\cos x + \\sin x + C\\).", solution: "Parts." }
          ]
        },
        {
          title: "Partial Fractions & Trig Integrals",
          questions: [
            { type: "regular", q: "\\(\\int \\dfrac{1}{x^2 - 1}\\,dx\\)?", answer: "\\(\\tfrac{1}{2}\\ln\\left|\\dfrac{x-1}{x+1}\\right| + C\\).", solution: "Partial fractions." },
            { type: "regular", q: "\\(\\int \\sin^2 x\\,dx\\)?", answer: "\\(\\dfrac{x - \\sin x \\cos x}{2} + C\\).", solution: "Power-reduction." },
            { type: "regular", q: "\\(\\int \\sec^2 x\\,dx\\)?", answer: "\\(\\tan x + C\\).", solution: "Standard." },
            { type: "regular", q: "\\(\\int \\tan x\\,dx\\)?", answer: "\\(-\\ln|\\cos x| + C\\) or \\(\\ln|\\sec x| + C\\).", solution: "\\(u = \\cos x\\)." },
            { type: "word", q: "\\(\\int \\dfrac{x}{x^2 + 1}\\,dx\\)?", answer: "\\(\\tfrac{1}{2}\\ln(x^2+1) + C\\).", solution: "\\(u = x^2+1\\)." }
          ]
        }
      ],
      cumulativeTest: {
        title: "Cumulative Test — Integration Techniques",
        questions: [
          { type: "regular", q: "\\(\\int 3x^2\\cos(x^3)\\,dx\\)?", answer: "\\(\\sin(x^3) + C\\).", solution: "\\(u = x^3\\)." },
          { type: "regular", q: "\\(\\int x e^{-x}\\,dx\\)?", answer: "\\(-e^{-x}(x + 1) + C\\).", solution: "Parts." },
          { type: "regular", q: "\\(\\int \\sec^2 x\\,dx\\)?", answer: "\\(\\tan x + C\\).", solution: "Standard." },
          { type: "regular", q: "\\(\\int \\dfrac{1}{x+2}\\,dx\\)?", answer: "\\(\\ln|x+2| + C\\).", solution: "Standard log." },
          { type: "word", q: "\\(\\int_0^1 2x(x^2+1)\\,dx\\)?", answer: "1.5.", solution: "\\(u = x^2+1\\); \\(\\tfrac{3^2 - 1}{4}\\) — or expand: \\([x^4/2 + x^2]_0^1 = 1.5\\)." },
          { type: "word", q: "\\(\\int x^2 \\ln x\\,dx\\)?", answer: "\\(\\dfrac{x^3\\ln x}{3} - \\dfrac{x^3}{9} + C\\).", solution: "Parts: \\(u = \\ln x, dv = x^2 dx\\)." }
        ]
      }
    },
    {
      id: "c7", num: 7, title: "Applications of Integrals", subtitle: "Area, volume, average value",
      emoji: "📦", accent: "#0284c7", accent2: "#7dbfe2",
      sections: [
        {
          title: "Area Between Curves",
          questions: [
            { type: "regular", q: "Area between \\(y = x^2\\) and \\(y = x\\) from 0 to 1?", answer: "\\(\\tfrac{1}{6}\\).", solution: "\\(\\int_0^1 (x - x^2)\\,dx\\)." },
            { type: "regular", q: "Area under \\(y = x^2\\) from 0 to 3?", answer: "9.", solution: "\\(\\tfrac{27}{3}\\)." },
            { type: "regular", q: "Area between \\(y = \\sin x\\) and \\(y = 0\\) from 0 to \\(\\pi\\)?", answer: "2.", solution: "\\(-\\cos\\pi + \\cos 0\\)." },
            { type: "regular", q: "Net area of \\(\\int_{-1}^{1} x\\,dx\\)?", answer: "0.", solution: "Odd function, symmetric limits." },
            { type: "word", q: "Area between \\(y = x\\) and \\(y = x^3\\) from 0 to 1?", answer: "\\(\\tfrac{1}{4}\\).", solution: "\\(\\int_0^1 (x - x^3)\\,dx = \\tfrac{1}{2} - \\tfrac{1}{4}\\)." }
          ]
        },
        {
          title: "Volumes of Revolution",
          questions: [
            { type: "regular", q: "Disk method formula for rotation about x-axis?", answer: "\\(V = \\pi\\int_a^b [f(x)]^2\\,dx\\).", solution: "Standard." },
            { type: "regular", q: "Rotate \\(y = \\sqrt{x}\\), \\(0 \\le x \\le 4\\), about x-axis. Volume?", answer: "\\(8\\pi\\).", solution: "\\(\\pi\\int_0^4 x\\,dx = \\pi \\cdot 8\\)." },
            { type: "regular", q: "Shell method formula (about y-axis)?", answer: "\\(V = 2\\pi\\int_a^b x f(x)\\,dx\\).", solution: "Standard." },
            { type: "regular", q: "Volume of cone radius 3, height 5 via integral?", answer: "\\(15\\pi\\).", solution: "\\(\\tfrac{1}{3}\\pi r^2 h\\)." },
            { type: "word", q: "Rotate \\(y = x\\), \\(0 \\le x \\le 1\\), about x-axis. Volume?", answer: "\\(\\tfrac{\\pi}{3}\\).", solution: "\\(\\pi\\int_0^1 x^2\\,dx\\)." }
          ]
        },
        {
          title: "Average Value & Applications",
          questions: [
            { type: "regular", q: "Average value formula of \\(f\\) on \\([a, b]\\)?", answer: "\\(\\dfrac{1}{b-a}\\int_a^b f(x)\\,dx\\).", solution: "Mean value of a function." },
            { type: "regular", q: "Average value of \\(f(x) = x^2\\) on \\([0, 3]\\)?", answer: "3.", solution: "\\(\\tfrac{1}{3}\\int_0^3 x^2\\,dx = \\tfrac{9}{3}\\)." },
            { type: "regular", q: "Average value of \\(\\sin x\\) on \\([0, \\pi]\\)?", answer: "\\(\\dfrac{2}{\\pi}\\).", solution: "\\(\\tfrac{1}{\\pi} \\cdot 2\\)." },
            { type: "regular", q: "Position from velocity: \\(s(t) = \\int v(t)\\,dt\\)?", answer: "Yes.", solution: "Integral of velocity is position." },
            { type: "word", q: "A car's velocity is \\(v(t) = 10t\\). Distance traveled from \\(t = 0\\) to \\(t = 5\\)?", answer: "125.", solution: "\\(\\int_0^5 10t\\,dt = 5t^2\\) at 5." }
          ]
        }
      ],
      cumulativeTest: {
        title: "Cumulative Test — Applications of Integrals",
        questions: [
          { type: "regular", q: "Area under \\(y = 2x\\) from 0 to 3?", answer: "9.", solution: "\\([x^2]_0^3\\)." },
          { type: "regular", q: "Area between \\(y = 4\\) and \\(y = x^2\\), \\(-2 \\le x \\le 2\\)?", answer: "\\(\\tfrac{32}{3}\\).", solution: "\\(\\int_{-2}^2(4 - x^2)\\,dx\\)." },
          { type: "regular", q: "Disk method formula?", answer: "\\(\\pi\\int [f]^2\\,dx\\).", solution: "Standard." },
          { type: "regular", q: "Average of \\(f(x) = x\\) on \\([0, 4]\\)?", answer: "2.", solution: "\\(\\tfrac{1}{4}\\int_0^4 x\\,dx\\)." },
          { type: "word", q: "Velocity \\(v(t) = 6t^2\\). Distance from \\(t = 0\\) to \\(t = 2\\)?", answer: "16.", solution: "\\(\\int_0^2 6t^2\\,dt = 2t^3\\) at 2." },
          { type: "word", q: "Volume rotating \\(y = x^2\\), \\(0 \\le x \\le 1\\), about x-axis?", answer: "\\(\\tfrac{\\pi}{5}\\).", solution: "\\(\\pi\\int_0^1 x^4\\,dx\\)." }
        ]
      }
    },
    {
      id: "c8", num: 8, title: "Sequences & Series", subtitle: "Convergence and tests",
      emoji: "♾️", accent: "#7c3aed", accent2: "#b295ec",
      sections: [
        {
          title: "Convergence of Sequences",
          questions: [
            { type: "regular", q: "\\(\\lim_{n \\to \\infty}\\dfrac{1}{n}\\)?", answer: "0.", solution: "Reciprocal of large." },
            { type: "regular", q: "Does \\(a_n = (-1)^n\\) converge?", answer: "No.", solution: "Oscillates between \\(\\pm 1\\)." },
            { type: "regular", q: "\\(\\lim_{n \\to \\infty}\\dfrac{n}{n + 1}\\)?", answer: "1.", solution: "Ratio of leading coeffs." },
            { type: "regular", q: "\\(\\lim_{n \\to \\infty}\\dfrac{n^2}{2^n}\\)?", answer: "0.", solution: "Exponential beats polynomial." },
            { type: "word", q: "Does \\(a_n = \\dfrac{\\ln n}{n}\\) converge? To what?", answer: "Yes, to 0.", solution: "\\(\\ln n\\) grows slower than \\(n\\)." }
          ]
        },
        {
          title: "Series Convergence Tests",
          questions: [
            { type: "regular", q: "Does \\(\\sum \\dfrac{1}{n}\\) converge?", answer: "No (harmonic series).", solution: "Divergent." },
            { type: "regular", q: "Does \\(\\sum \\dfrac{1}{n^2}\\) converge?", answer: "Yes.", solution: "p-series with \\(p = 2 > 1\\)." },
            { type: "regular", q: "Geometric series \\(\\sum ar^n\\) converges when?", answer: "\\(|r| < 1\\).", solution: "Standard condition." },
            { type: "regular", q: "Sum of \\(\\sum_{n=0}^{\\infty}\\left(\\dfrac{1}{2}\\right)^n\\)?", answer: "2.", solution: "\\(\\tfrac{1}{1 - 1/2}\\)." },
            { type: "word", q: "Does \\(\\sum \\dfrac{(-1)^n}{n}\\) converge?", answer: "Yes (alternating harmonic).", solution: "Alternating series test." }
          ]
        },
        {
          title: "Power & Taylor Series",
          questions: [
            { type: "regular", q: "Maclaurin series for \\(e^x\\)?", answer: "\\(\\sum_{n=0}^\\infty \\dfrac{x^n}{n!}\\).", solution: "Standard." },
            { type: "regular", q: "Maclaurin series for \\(\\sin x\\)?", answer: "\\(x - \\dfrac{x^3}{3!} + \\dfrac{x^5}{5!} - \\cdots\\).", solution: "Standard." },
            { type: "regular", q: "First three terms of \\(\\cos x\\) series?", answer: "\\(1 - \\dfrac{x^2}{2} + \\dfrac{x^4}{24}\\).", solution: "Standard." },
            { type: "regular", q: "Radius of convergence of \\(\\sum \\dfrac{x^n}{n!}\\)?", answer: "\\(\\infty\\).", solution: "Converges for all \\(x\\)." },
            { type: "word", q: "Approximate \\(e^{0.1}\\) using the first three terms of its series.", answer: "\\(\\approx 1.105\\).", solution: "\\(1 + 0.1 + 0.005\\)." }
          ]
        }
      ],
      cumulativeTest: {
        title: "Cumulative Test — Sequences & Series",
        questions: [
          { type: "regular", q: "\\(\\lim_{n\\to\\infty}\\dfrac{1}{n^2}\\)?", answer: "0.", solution: "Goes to 0." },
          { type: "regular", q: "Does \\(\\sum \\dfrac{1}{n^3}\\) converge?", answer: "Yes.", solution: "p-series, \\(p = 3 > 1\\)." },
          { type: "regular", q: "Sum \\(\\sum_{n=0}^\\infty(1/3)^n\\)?", answer: "\\(\\dfrac{3}{2}\\).", solution: "\\(\\tfrac{1}{1 - 1/3}\\)." },
          { type: "regular", q: "Maclaurin for \\(e^x\\) first three terms?", answer: "\\(1 + x + \\dfrac{x^2}{2}\\).", solution: "Standard." },
          { type: "word", q: "Does \\(\\sum \\dfrac{1}{\\sqrt n}\\) converge?", answer: "No.", solution: "p-series \\(p = 1/2 < 1\\)." },
          { type: "word", q: "Approximate \\(\\sin(0.1)\\) using two terms.", answer: "\\(\\approx 0.09983\\).", solution: "\\(0.1 - \\tfrac{0.001}{6}\\)." }
        ]
      }
    },
    {
      id: "c9", num: 9, title: "Differential Equations", subtitle: "Intro to DEs",
      emoji: "🌀", accent: "#be185d", accent2: "#e69abc",
      sections: [
        {
          title: "Basic DEs",
          questions: [
            { type: "regular", q: "What is a differential equation?", answer: "An equation involving an unknown function and its derivatives.", solution: "Definition." },
            { type: "regular", q: "Order of \\(y'' + y = 0\\)?", answer: "2.", solution: "Highest derivative." },
            { type: "regular", q: "Solve \\(y' = 2x\\).", answer: "\\(y = x^2 + C\\).", solution: "Antiderivative." },
            { type: "regular", q: "Solve \\(y' = y\\).", answer: "\\(y = Ce^x\\).", solution: "Classic exponential DE." },
            { type: "word", q: "Population growth \\(\\dfrac{dP}{dt} = kP\\) is solved by?", answer: "\\(P(t) = P_0 e^{kt}\\).", solution: "Exponential model." }
          ]
        },
        {
          title: "Separation of Variables",
          questions: [
            { type: "regular", q: "Solve \\(\\dfrac{dy}{dx} = xy\\).", answer: "\\(y = Ce^{x^2/2}\\).", solution: "Separate: \\(\\dfrac{dy}{y} = x\\,dx\\)." },
            { type: "regular", q: "Solve \\(\\dfrac{dy}{dx} = \\dfrac{x}{y}\\).", answer: "\\(y^2 - x^2 = C\\).", solution: "Separate and integrate." },
            { type: "regular", q: "What are separable DEs?", answer: "DEs that can be written as \\(f(y)\\,dy = g(x)\\,dx\\).", solution: "Separate the variables." },
            { type: "regular", q: "Solve \\(y' = y^2\\).", answer: "\\(y = \\dfrac{-1}{x + C}\\).", solution: "Separate: \\(-\\dfrac{1}{y} = x + C\\)." },
            { type: "word", q: "Solve \\(y' = 3y\\), \\(y(0) = 2\\).", answer: "\\(y = 2e^{3x}\\).", solution: "\\(y = Ce^{3x}\\); \\(C = 2\\)." }
          ]
        },
        {
          title: "Applications",
          questions: [
            { type: "regular", q: "Exponential decay model: \\(y' = -ky\\) with \\(k > 0\\). Solution?", answer: "\\(y = y_0 e^{-kt}\\).", solution: "Standard." },
            { type: "regular", q: "Half-life relates to \\(k\\) how?", answer: "\\(t_{1/2} = \\dfrac{\\ln 2}{k}\\).", solution: "Solve \\(y_0/2 = y_0 e^{-kt}\\)." },
            { type: "regular", q: "Newton's law of cooling equation?", answer: "\\(T' = -k(T - T_{\\text{env}})\\).", solution: "Standard form." },
            { type: "regular", q: "Logistic equation form?", answer: "\\(P' = rP(1 - P/K)\\).", solution: "Bounded growth." },
            { type: "word", q: "A radioactive substance has half-life 10 years. Find \\(k\\) in \\(y = y_0 e^{-kt}\\).", answer: "\\(k = \\dfrac{\\ln 2}{10} \\approx 0.0693\\).", solution: "Half-life formula." }
          ]
        }
      ],
      cumulativeTest: {
        title: "Cumulative Test — Differential Equations",
        questions: [
          { type: "regular", q: "Order of \\(y''' + y' = 0\\)?", answer: "3.", solution: "Highest derivative." },
          { type: "regular", q: "Solve \\(y' = 4\\).", answer: "\\(y = 4x + C\\).", solution: "Antiderivative." },
          { type: "regular", q: "Solve \\(y' = -2y\\).", answer: "\\(y = Ce^{-2x}\\).", solution: "Exponential DE." },
          { type: "regular", q: "Exponential growth DE?", answer: "\\(y' = ky\\).", solution: "Standard." },
          { type: "word", q: "Solve \\(y' = y\\), \\(y(0) = 5\\).", answer: "\\(y = 5e^x\\).", solution: "\\(C = 5\\)." },
          { type: "word", q: "Half-life 20 years. Find \\(k\\).", answer: "\\(k = \\dfrac{\\ln 2}{20}\\).", solution: "Half-life formula." }
        ]
      }
    }
  ]
};
