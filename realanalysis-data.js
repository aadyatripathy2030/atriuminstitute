// Real Analysis course — rigorous calculus and topology of R.
const REALANALYSIS_COURSE = {
  id: "realanalysis",
  title: "Real Analysis",
  subtitle: "Rigorous calculus and the structure of ℝ",
  emoji: "ℝ",
  accent: "#222f3e",
  accent2: "#5d7a9c",
  description: "Five chapters covering sequences, series, continuity, differentiation, and integration — the rigorous foundations of calculus.",
  books: [
    {
      id: "ra1", num: 1, title: "Sequences & Limits", subtitle: "ε-N definition, monotone, Cauchy",
      emoji: "🔢", accent: "#222f3e", accent2: "#5d7a9c",
      sections: [
        {
          title: "Sequence Limits (ε-N Definition)",
          questions: [
            { type: "regular", q: "Limit of \\(a_n = 1/n\\)?", answer: "0.", solution: "Standard." },
            { type: "regular", q: "ε-N definition of \\(\\lim a_n = L\\)?", answer: "For every ε > 0, there exists N such that n ≥ N implies |a_n − L| < ε.", solution: "Standard." },
            { type: "regular", q: "Limit of \\(a_n = (-1)^n\\)?", answer: "Does not exist.", solution: "Alternates." },
            { type: "regular", q: "Limit of \\(a_n = n^2\\)?", answer: "Diverges to ∞.", solution: "Unbounded." },
            { type: "word", q: "Limits are unique. T/F?", answer: "True.", solution: "Standard theorem." }
          ]
        },
        {
          title: "Monotone & Bounded Sequences",
          questions: [
            { type: "regular", q: "Monotone Convergence Theorem (statement)?", answer: "Monotone + bounded ⇒ convergent.", solution: "Standard." },
            { type: "regular", q: "Is \\(a_n = 1 - 1/n\\) increasing?", answer: "Yes.", solution: "Standard." },
            { type: "regular", q: "Bounded but not monotone — converges?", answer: "Not necessarily.", solution: "e.g. \\((-1)^n\\)." },
            { type: "regular", q: "Increasing + upper-bounded ⇒ ?", answer: "Converges (to supremum).", solution: "Standard." },
            { type: "word", q: "Decreasing + lower-bounded ⇒ ?", answer: "Converges (to infimum).", solution: "Standard." }
          ]
        },
        {
          title: "Cauchy Sequences",
          questions: [
            { type: "regular", q: "Cauchy definition?", answer: "For every ε > 0, ∃ N: m, n ≥ N ⇒ \\(|a_m - a_n| < \\varepsilon\\).", solution: "Standard." },
            { type: "regular", q: "In \\(\\mathbb{R}\\), Cauchy iff?", answer: "Convergent.", solution: "ℝ is complete." },
            { type: "regular", q: "Every convergent sequence is Cauchy. T/F?", answer: "True.", solution: "Standard." },
            { type: "regular", q: "Cauchy sequences are bounded. T/F?", answer: "True.", solution: "Standard." },
            { type: "word", q: "Is \\(\\mathbb{Q}\\) complete?", answer: "No.", solution: "Has Cauchy seqs that don't converge in \\(\\mathbb{Q}\\)." }
          ]
        }
      ],
      cumulativeTest: {
        title: "Cumulative Test — Sequences",
        questions: [
          { type: "regular", q: "Limit of \\(1/n\\)?", answer: "0.", solution: "Standard." },
          { type: "regular", q: "Monotone + bounded ⇒ ?", answer: "Convergent.", solution: "MCT." },
          { type: "regular", q: "Cauchy ⇔ convergent in?", answer: "ℝ.", solution: "Completeness." },
          { type: "regular", q: "Limit of \\((-1)^n\\)?", answer: "DNE.", solution: "Alternates." },
          { type: "word", q: "Limits are unique. T/F?", answer: "True.", solution: "Standard." },
          { type: "word", q: "Cauchy ⇒ bounded. T/F?", answer: "True.", solution: "Standard." }
        ]
      }
    },
    {
      id: "ra2", num: 2, title: "Series", subtitle: "Convergence tests and power series",
      emoji: "∑", accent: "#5f27cd", accent2: "#48dbfb",
      sections: [
        {
          title: "Convergence Tests",
          questions: [
            { type: "regular", q: "Geometric series \\(\\sum r^n\\) converges when?", answer: "|r| < 1.", solution: "Standard." },
            { type: "regular", q: "Harmonic series \\(\\sum 1/n\\) converges?", answer: "No (diverges).", solution: "Classic example." },
            { type: "regular", q: "p-series \\(\\sum 1/n^p\\) converges when?", answer: "p > 1.", solution: "Standard." },
            { type: "regular", q: "Ratio test: limit r > 1?", answer: "Diverges.", solution: "Standard." },
            { type: "word", q: "Necessary condition for convergence?", answer: "Terms → 0.", solution: "Standard (not sufficient)." }
          ]
        },
        {
          title: "Absolute & Conditional Convergence",
          questions: [
            { type: "regular", q: "Absolute convergence: \\(\\sum |a_n|\\) converges?", answer: "Yes.", solution: "Stronger than ordinary." },
            { type: "regular", q: "Conditional convergence?", answer: "Converges but \\(\\sum |a_n|\\) doesn't.", solution: "Standard." },
            { type: "regular", q: "Example of conditional?", answer: "\\(\\sum (-1)^n / n\\) (alternating harmonic).", solution: "Standard." },
            { type: "regular", q: "Absolute ⇒ convergent. T/F?", answer: "True.", solution: "Standard." },
            { type: "word", q: "Rearranging conditionally convergent series can change sum. T/F?", answer: "True.", solution: "Riemann rearrangement theorem." }
          ]
        },
        {
          title: "Power Series",
          questions: [
            { type: "regular", q: "Power series form?", answer: "\\(\\sum a_n (x - c)^n\\).", solution: "Standard." },
            { type: "regular", q: "Radius of convergence formula (ratio)?", answer: "\\(R = \\lim |a_n / a_{n+1}|\\).", solution: "Standard." },
            { type: "regular", q: "Inside R, series converges absolutely. T/F?", answer: "True.", solution: "Standard." },
            { type: "regular", q: "Outside R?", answer: "Diverges.", solution: "Standard." },
            { type: "word", q: "Power series for \\(e^x\\)?", answer: "\\(\\sum x^n/n!\\).", solution: "Standard." }
          ]
        }
      ],
      cumulativeTest: {
        title: "Cumulative Test — Series",
        questions: [
          { type: "regular", q: "p-series converges when?", answer: "p > 1.", solution: "Standard." },
          { type: "regular", q: "Geometric \\(\\sum r^n\\) converges when?", answer: "|r| < 1.", solution: "Standard." },
          { type: "regular", q: "Harmonic series?", answer: "Diverges.", solution: "Classic." },
          { type: "regular", q: "Power series radius?", answer: "R from ratio/root test.", solution: "Standard." },
          { type: "word", q: "Absolute ⇒ convergent. T/F?", answer: "True.", solution: "Standard." },
          { type: "word", q: "Series for \\(e^x\\)?", answer: "\\(\\sum x^n/n!\\).", solution: "Standard." }
        ]
      }
    },
    {
      id: "ra3", num: 3, title: "Continuity", subtitle: "ε-δ, uniform, IVT",
      emoji: "📈", accent: "#10ac84", accent2: "#1dd1a1",
      sections: [
        {
          title: "ε-δ Continuity",
          questions: [
            { type: "regular", q: "f continuous at c: definition?", answer: "For all ε > 0, ∃ δ > 0: |x − c| < δ ⇒ |f(x) − f(c)| < ε.", solution: "Standard." },
            { type: "regular", q: "Polynomials are continuous everywhere. T/F?", answer: "True.", solution: "Standard." },
            { type: "regular", q: "Discontinuity types? (list one)", answer: "Jump, removable, essential.", solution: "Three types." },
            { type: "regular", q: "Is \\(f(x) = 1/x\\) continuous on \\((0, \\infty)\\)?", answer: "Yes.", solution: "Standard." },
            { type: "word", q: "Composition of continuous functions is continuous. T/F?", answer: "True.", solution: "Standard." }
          ]
        },
        {
          title: "Uniform Continuity",
          questions: [
            { type: "regular", q: "Uniform continuity: δ depends only on?", answer: "ε (not on the point c).", solution: "Standard." },
            { type: "regular", q: "Uniform on compact intervals: ?", answer: "Every continuous f on [a,b] is uniformly continuous.", solution: "Heine-Cantor." },
            { type: "regular", q: "\\(f(x) = x^2\\) uniformly continuous on \\(\\mathbb{R}\\)?", answer: "No.", solution: "Slope grows." },
            { type: "regular", q: "On [0, 1], \\(x^2\\) is uniformly continuous?", answer: "Yes.", solution: "Compact interval." },
            { type: "word", q: "Lipschitz ⇒ uniformly continuous. T/F?", answer: "True.", solution: "Standard." }
          ]
        },
        {
          title: "Intermediate Value Theorem",
          questions: [
            { type: "regular", q: "IVT requires f continuous on?", answer: "Closed interval [a, b].", solution: "Standard." },
            { type: "regular", q: "IVT conclusion?", answer: "f takes every value between f(a) and f(b).", solution: "Standard." },
            { type: "regular", q: "Does \\(x^3 - x - 1 = 0\\) have a real root?", answer: "Yes.", solution: "By IVT between 1 and 2." },
            { type: "regular", q: "Extreme Value Theorem?", answer: "Continuous on closed interval attains max and min.", solution: "Standard." },
            { type: "word", q: "Why need closed interval in EVT?", answer: "Open interval can miss extremes.", solution: "Standard." }
          ]
        }
      ],
      cumulativeTest: {
        title: "Cumulative Test — Continuity",
        questions: [
          { type: "regular", q: "Polynomials continuous everywhere?", answer: "Yes.", solution: "Standard." },
          { type: "regular", q: "IVT applies on?", answer: "Closed interval, continuous f.", solution: "Standard." },
          { type: "regular", q: "Uniform continuity: δ depends only on?", answer: "ε.", solution: "Standard." },
          { type: "regular", q: "Continuous f on compact ⇒ uniform. T/F?", answer: "True.", solution: "Heine-Cantor." },
          { type: "word", q: "Composition of continuous?", answer: "Continuous.", solution: "Standard." },
          { type: "word", q: "EVT requires?", answer: "Continuous + closed interval.", solution: "Standard." }
        ]
      }
    },
    {
      id: "ra4", num: 4, title: "Differentiation", subtitle: "Rigorous derivative and MVT",
      emoji: "📐", accent: "#ff9f43", accent2: "#feca57",
      sections: [
        {
          title: "Definition of Derivative",
          questions: [
            { type: "regular", q: "Derivative definition?", answer: "\\(f'(c) = \\lim_{h\\to 0} \\dfrac{f(c+h) - f(c)}{h}\\).", solution: "Standard." },
            { type: "regular", q: "Derivative of \\(x^2\\)?", answer: "\\(2x\\).", solution: "Standard." },
            { type: "regular", q: "f differentiable at c ⇒ continuous at c. T/F?", answer: "True.", solution: "Standard." },
            { type: "regular", q: "Converse: continuous ⇒ differentiable?", answer: "Not always.", solution: "e.g. |x| at 0." },
            { type: "word", q: "Where is \\(f(x) = |x|\\) not differentiable?", answer: "x = 0.", solution: "Corner." }
          ]
        },
        {
          title: "Mean Value Theorem",
          questions: [
            { type: "regular", q: "MVT requires?", answer: "Continuous on [a,b], differentiable on (a,b).", solution: "Standard." },
            { type: "regular", q: "MVT conclusion?", answer: "∃ c with \\(f'(c) = \\dfrac{f(b)-f(a)}{b-a}\\).", solution: "Standard." },
            { type: "regular", q: "Rolle's theorem is MVT with?", answer: "f(a) = f(b).", solution: "Special case." },
            { type: "regular", q: "MVT implies if f' = 0 on interval, f is?", answer: "Constant.", solution: "Standard." },
            { type: "word", q: "MVT applies to which function on [0,1]: f(x) = √x?", answer: "Yes (continuous + diff on (0,1)).", solution: "Standard." }
          ]
        },
        {
          title: "L'Hôpital & Taylor's Theorem",
          questions: [
            { type: "regular", q: "L'Hôpital's rule applies when?", answer: "0/0 or ∞/∞ indeterminate forms.", solution: "Standard." },
            { type: "regular", q: "\\(\\lim_{x \\to 0} \\sin x / x\\)?", answer: "1.", solution: "Standard limit." },
            { type: "regular", q: "Taylor's theorem provides?", answer: "Polynomial approximation with remainder.", solution: "Standard." },
            { type: "regular", q: "Taylor series of \\(\\sin x\\) around 0 starts?", answer: "\\(x - x^3/6 + \\ldots\\).", solution: "Standard." },
            { type: "word", q: "First-order Taylor is just?", answer: "Linear approximation (tangent line).", solution: "Standard." }
          ]
        }
      ],
      cumulativeTest: {
        title: "Cumulative Test — Differentiation",
        questions: [
          { type: "regular", q: "Derivative definition?", answer: "Limit of difference quotient.", solution: "Standard." },
          { type: "regular", q: "Differentiable ⇒ continuous. T/F?", answer: "True.", solution: "Standard." },
          { type: "regular", q: "MVT conclusion?", answer: "\\(f'(c) = (f(b)-f(a))/(b-a)\\).", solution: "Standard." },
          { type: "regular", q: "L'Hôpital for what forms?", answer: "0/0, ∞/∞.", solution: "Standard." },
          { type: "word", q: "Continuous but not differentiable: example?", answer: "|x| at 0.", solution: "Standard." },
          { type: "word", q: "Taylor series of \\(\\cos x\\) starts?", answer: "\\(1 - x^2/2 + \\ldots\\).", solution: "Standard." }
        ]
      }
    },
    {
      id: "ra5", num: 5, title: "Riemann Integration", subtitle: "Riemann sums and FTC",
      emoji: "∫", accent: "#48dbfb", accent2: "#5f27cd",
      sections: [
        {
          title: "Riemann Sums & Integrability",
          questions: [
            { type: "regular", q: "Riemann integrable on [a,b] requires?", answer: "Upper and lower sums converge to same limit.", solution: "Standard." },
            { type: "regular", q: "Continuous on [a,b] ⇒ Riemann integrable. T/F?", answer: "True.", solution: "Standard." },
            { type: "regular", q: "Monotone on [a,b] ⇒ integrable. T/F?", answer: "True.", solution: "Standard." },
            { type: "regular", q: "Indicator of rationals on [0,1]: integrable?", answer: "No.", solution: "Classic non-integrable example." },
            { type: "word", q: "Riemann partition has?", answer: "Subintervals + sample points.", solution: "Standard." }
          ]
        },
        {
          title: "Fundamental Theorem of Calculus",
          questions: [
            { type: "regular", q: "FTC Part 1?", answer: "If F'(x) = f(x), then ∫f = F(b) − F(a).", solution: "Standard." },
            { type: "regular", q: "FTC Part 2?", answer: "\\(\\dfrac{d}{dx}\\int_a^x f(t) dt = f(x)\\).", solution: "Standard." },
            { type: "regular", q: "FTC connects?", answer: "Derivative and integral (inverse operations).", solution: "Standard." },
            { type: "regular", q: "Antiderivative of \\(\\cos x\\)?", answer: "\\(\\sin x + C\\).", solution: "Standard." },
            { type: "word", q: "Evaluate \\(\\int_0^1 x \\, dx\\).", answer: "1/2.", solution: "\\(x^2/2\\) from 0 to 1." }
          ]
        },
        {
          title: "Improper Integrals & Convergence",
          questions: [
            { type: "regular", q: "Improper integral on \\([a, \\infty)\\) is?", answer: "\\(\\lim_{b\\to\\infty}\\int_a^b f\\).", solution: "Standard." },
            { type: "regular", q: "\\(\\int_1^\\infty 1/x \\, dx\\)?", answer: "Diverges.", solution: "Same as harmonic." },
            { type: "regular", q: "\\(\\int_1^\\infty 1/x^2 \\, dx\\)?", answer: "1.", solution: "Converges." },
            { type: "regular", q: "Comparison test for improper integrals?", answer: "If 0 ≤ f ≤ g and ∫g converges, so does ∫f.", solution: "Standard." },
            { type: "word", q: "Convergent iff limit exists and is finite. T/F?", answer: "True.", solution: "Standard." }
          ]
        }
      ],
      cumulativeTest: {
        title: "Cumulative Test — Integration",
        questions: [
          { type: "regular", q: "Continuous ⇒ Riemann integrable. T/F?", answer: "True.", solution: "Standard." },
          { type: "regular", q: "FTC Part 1?", answer: "\\(\\int_a^b f = F(b) - F(a)\\).", solution: "Standard." },
          { type: "regular", q: "Antiderivative of \\(1/x\\)?", answer: "\\(\\ln|x| + C\\).", solution: "Standard." },
          { type: "regular", q: "\\(\\int_1^\\infty 1/x^2\\)?", answer: "1.", solution: "Converges." },
          { type: "word", q: "\\(\\int_0^1 x^2\\)?", answer: "1/3.", solution: "\\(x^3/3\\) from 0 to 1." },
          { type: "word", q: "Indicator of rationals integrable?", answer: "No.", solution: "Standard." }
        ]
      }
    }
  ]
};
