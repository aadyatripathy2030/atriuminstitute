// Algebra 2 course — advanced topics beyond the core algebra track.
const ALGEBRA2_COURSE = {
  id: "algebra2",
  title: "Algebra 2",
  subtitle: "Polynomials, exponentials, logs, and beyond",
  emoji: "🧮",
  accent: "#7c5cff",
  accent2: "#a88bff",
  description: "Nine topics covering polynomial and rational functions, exponentials and logs, sequences, conics, trigonometry, and statistics.",
  books: [
    {
      id: "a1", num: 1, title: "Polynomial Functions", subtitle: "Higher-degree polynomials",
      emoji: "📊", accent: "#7c5cff", accent2: "#a88bff",
      sections: [
        {
          title: "End Behavior and Degree",
          questions: [
            { type: "regular", q: "What is the degree of \\(f(x) = 2x^4 - 3x^3 + x\\)?", answer: "4.", solution: "Highest exponent." },
            { type: "regular", q: "What is the leading coefficient of \\(-5x^3 + 2x + 1\\)?", answer: "\\(-5\\).", solution: "Coefficient of highest-degree term." },
            { type: "regular", q: "As \\(x \\to \\infty\\), what happens to \\(f(x) = x^3\\)?", answer: "\\(f(x) \\to \\infty\\).", solution: "Odd-degree with positive leading coefficient." },
            { type: "regular", q: "End behavior of \\(f(x) = -2x^4\\)?", answer: "Both ends go to \\(-\\infty\\).", solution: "Even degree, negative leading coeff → both ends down." },
            { type: "word", q: "A model is \\(P(t) = -t^3 + 10t^2\\). Is the degree odd or even?", answer: "Odd (degree 3).", solution: "Highest power is 3." }
          ]
        },
        {
          title: "Factoring and Zeros",
          questions: [
            { type: "regular", q: "Find the zeros of \\(f(x) = x^3 - 4x\\).", answer: "\\(x = 0, 2, -2\\).", solution: "Factor \\(x(x^2 - 4) = x(x-2)(x+2)\\)." },
            { type: "regular", q: "Factor \\(x^3 - 27\\).", answer: "\\((x-3)(x^2 + 3x + 9)\\).", solution: "Difference of cubes." },
            { type: "regular", q: "Factor \\(x^3 + 8\\).", answer: "\\((x+2)(x^2 - 2x + 4)\\).", solution: "Sum of cubes." },
            { type: "regular", q: "How many zeros (with multiplicity) does a degree-5 polynomial have?", answer: "5.", solution: "Fundamental theorem of algebra." },
            { type: "word", q: "A polynomial has zeros at \\(x = 1, 2, -3\\). Write one possible polynomial.", answer: "\\((x-1)(x-2)(x+3)\\).", solution: "Each zero gives a linear factor." }
          ]
        },
        {
          title: "Polynomial Division",
          questions: [
            { type: "regular", q: "Divide \\((x^2 + 5x + 6) \\div (x + 2)\\).", answer: "\\(x + 3\\).", solution: "Long division or factoring." },
            { type: "regular", q: "Divide \\((x^3 - 1) \\div (x - 1)\\).", answer: "\\(x^2 + x + 1\\).", solution: "Difference of cubes / synthetic division." },
            { type: "regular", q: "Is \\(x - 2\\) a factor of \\(x^3 - 8\\)?", answer: "Yes.", solution: "\\(f(2) = 0\\) by factor theorem." },
            { type: "regular", q: "Remainder when \\(x^3 + 2x + 5\\) is divided by \\(x - 1\\)?", answer: "8.", solution: "\\(f(1) = 1 + 2 + 5 = 8\\)." },
            { type: "word", q: "Use the factor theorem: is \\(x + 3\\) a factor of \\(x^2 + 5x + 6\\)?", answer: "Yes.", solution: "\\(f(-3) = 9 - 15 + 6 = 0\\)." }
          ]
        }
      ],
      cumulativeTest: {
        title: "Cumulative Test — Polynomial Functions",
        questions: [
          { type: "regular", q: "Degree of \\(3x^5 - 2x^2 + 7\\)?", answer: "5.", solution: "Highest exponent." },
          { type: "regular", q: "Zeros of \\(x^3 - 9x\\)?", answer: "\\(x = 0, 3, -3\\).", solution: "\\(x(x^2-9)\\)." },
          { type: "regular", q: "Factor \\(x^3 - 64\\).", answer: "\\((x-4)(x^2+4x+16)\\).", solution: "Difference of cubes." },
          { type: "regular", q: "Divide \\((x^2 + 7x + 12) \\div (x+3)\\).", answer: "\\(x + 4\\).", solution: "Factor and cancel." },
          { type: "word", q: "A polynomial has roots \\(0, 2, -4\\). Write one form.", answer: "\\(x(x-2)(x+4)\\).", solution: "Linear factors." },
          { type: "word", q: "End behavior of \\(f(x) = x^6\\)?", answer: "Both ends go to \\(+\\infty\\).", solution: "Even degree, positive coeff." }
        ]
      }
    },
    {
      id: "a2", num: 2, title: "Exponential Functions", subtitle: "Growth, decay, the number e",
      emoji: "📈", accent: "#ff7a5c", accent2: "#ffa88a",
      sections: [
        {
          title: "Growth and Decay",
          questions: [
            { type: "regular", q: "Does \\(f(x) = 2 \\cdot 3^x\\) grow or decay?", answer: "Grow.", solution: "Base \\(3 > 1\\)." },
            { type: "regular", q: "Does \\(f(x) = 5 \\cdot (0.4)^x\\) grow or decay?", answer: "Decay.", solution: "Base \\(0 < 0.4 < 1\\)." },
            { type: "regular", q: "Find \\(f(3)\\) for \\(f(x) = 2^x\\).", answer: "8.", solution: "\\(2^3\\)." },
            { type: "regular", q: "What's the y-intercept of \\(f(x) = a \\cdot b^x\\)?", answer: "\\(a\\).", solution: "\\(f(0) = a \\cdot b^0 = a\\)." },
            { type: "word", q: "A population doubles every year, starting at 100. Formula?", answer: "\\(P(t) = 100 \\cdot 2^t\\).", solution: "Growth factor 2, per year." }
          ]
        },
        {
          title: "Compound Interest",
          questions: [
            { type: "regular", q: "Using \\(A = P(1+r)^t\\): $1000 at 5% for 3 years?", answer: "$1157.63.", solution: "\\(1000(1.05)^3\\)." },
            { type: "regular", q: "Using continuous compounding \\(A = Pe^{rt}\\): $500 at 4% for 2 years?", answer: "\\(\\approx $541.64\\).", solution: "\\(500 e^{0.08} \\approx 541.64\\)." },
            { type: "regular", q: "Compounded monthly: formula?", answer: "\\(A = P(1 + r/12)^{12t}\\).", solution: "12 periods per year." },
            { type: "regular", q: "Is the formula \\(A = P(1 + r)^t\\) for simple or compound interest?", answer: "Compound.", solution: "Simple is \\(A = P + Prt\\)." },
            { type: "word", q: "A $2000 investment grows continuously at 6%. Value after 5 years?", answer: "\\(\\approx $2699.72\\).", solution: "\\(2000 e^{0.3}\\)." }
          ]
        },
        {
          title: "Transformations of Exponential Functions",
          questions: [
            { type: "regular", q: "How does \\(f(x) = 2^x + 3\\) differ from \\(f(x) = 2^x\\)?", answer: "Shifted up 3.", solution: "Vertical translation." },
            { type: "regular", q: "Horizontal asymptote of \\(f(x) = 3^x\\)?", answer: "\\(y = 0\\).", solution: "As \\(x \\to -\\infty\\), \\(f \\to 0\\)." },
            { type: "regular", q: "Horizontal asymptote of \\(f(x) = 2^x - 5\\)?", answer: "\\(y = -5\\).", solution: "Shift down 5 moves asymptote." },
            { type: "regular", q: "Domain of any exponential function?", answer: "All real numbers.", solution: "Defined for every \\(x\\)." },
            { type: "word", q: "A graph of \\(f(x) = a \\cdot b^x\\) has y-intercept 4 and passes through \\((1, 12)\\). Find \\(b\\).", answer: "3.", solution: "\\(a = 4\\); \\(4b = 12\\)." }
          ]
        }
      ],
      cumulativeTest: {
        title: "Cumulative Test — Exponential Functions",
        questions: [
          { type: "regular", q: "\\(f(x) = 3 \\cdot 2^x\\): growth or decay?", answer: "Growth.", solution: "Base > 1." },
          { type: "regular", q: "Find \\(f(4)\\) if \\(f(x) = 5^x / 25\\).", answer: "25.", solution: "\\(625 / 25\\)." },
          { type: "regular", q: "Asymptote of \\(f(x) = 2^x + 7\\)?", answer: "\\(y = 7\\).", solution: "Shift up 7." },
          { type: "regular", q: "Formula for continuous compounding?", answer: "\\(A = Pe^{rt}\\).", solution: "Continuous interest formula." },
          { type: "word", q: "Rabbit population triples yearly; starts at 50. Population after \\(t\\) years?", answer: "\\(P(t) = 50 \\cdot 3^t\\).", solution: "Growth factor 3." },
          { type: "word", q: "$3000 at 4% compounded annually for 6 years. Final value?", answer: "\\(\\approx $3795.96\\).", solution: "\\(3000(1.04)^6\\)." }
        ]
      }
    },
    {
      id: "a3", num: 3, title: "Logarithmic Functions", subtitle: "Logs, properties, equations",
      emoji: "📉", accent: "#5ec2a8", accent2: "#9bdfc9",
      sections: [
        {
          title: "Log Basics and Rewriting",
          questions: [
            { type: "regular", q: "Evaluate \\(\\log_2 8\\).", answer: "3.", solution: "\\(2^3 = 8\\)." },
            { type: "regular", q: "Evaluate \\(\\log_{10} 1000\\).", answer: "3.", solution: "\\(10^3 = 1000\\)." },
            { type: "regular", q: "Rewrite \\(2^5 = 32\\) in log form.", answer: "\\(\\log_2 32 = 5\\).", solution: "Exponential to log." },
            { type: "regular", q: "Rewrite \\(\\log_3 81 = 4\\) in exponential form.", answer: "\\(3^4 = 81\\).", solution: "Log to exponential." },
            { type: "word", q: "What's the domain of \\(f(x) = \\log x\\)?", answer: "\\(x > 0\\).", solution: "Log is only defined for positive inputs." }
          ]
        },
        {
          title: "Properties of Logs",
          questions: [
            { type: "regular", q: "Simplify \\(\\log 2 + \\log 5\\).", answer: "1.", solution: "\\(\\log(2 \\cdot 5) = \\log 10 = 1\\)." },
            { type: "regular", q: "Simplify \\(\\log_2 16 - \\log_2 4\\).", answer: "2.", solution: "\\(\\log_2 4 = 2\\)." },
            { type: "regular", q: "Simplify \\(\\log 10^3\\).", answer: "3.", solution: "Power rule." },
            { type: "regular", q: "Expand \\(\\log(x^2 y)\\).", answer: "\\(2\\log x + \\log y\\).", solution: "Product + power rules." },
            { type: "word", q: "Why is \\(\\log 1 = 0\\) for any base?", answer: "Because \\(b^0 = 1\\) for any \\(b\\).", solution: "Definition of log." }
          ]
        },
        {
          title: "Solving Log and Exponential Equations",
          questions: [
            { type: "regular", q: "Solve \\(2^x = 32\\).", answer: "\\(x = 5\\).", solution: "\\(32 = 2^5\\)." },
            { type: "regular", q: "Solve \\(\\log_3 x = 4\\).", answer: "\\(x = 81\\).", solution: "\\(x = 3^4\\)." },
            { type: "regular", q: "Solve \\(\\log_2 (x + 1) = 3\\).", answer: "\\(x = 7\\).", solution: "\\(x + 1 = 8\\)." },
            { type: "regular", q: "Solve \\(5^x = 125\\).", answer: "\\(x = 3\\).", solution: "\\(125 = 5^3\\)." },
            { type: "word", q: "A sound level \\(L = 10\\log(I/I_0)\\). If \\(I = 100 I_0\\), find \\(L\\).", answer: "20 dB.", solution: "\\(10 \\log 100 = 20\\)." }
          ]
        }
      ],
      cumulativeTest: {
        title: "Cumulative Test — Logarithmic Functions",
        questions: [
          { type: "regular", q: "\\(\\log_5 25\\)?", answer: "2.", solution: "\\(5^2 = 25\\)." },
          { type: "regular", q: "Rewrite \\(\\log_2 64 = 6\\) as exponential.", answer: "\\(2^6 = 64\\).", solution: "Swap form." },
          { type: "regular", q: "Solve \\(3^x = 27\\).", answer: "\\(x = 3\\).", solution: "\\(27 = 3^3\\)." },
          { type: "regular", q: "Simplify \\(\\log 20 - \\log 2\\).", answer: "1.", solution: "\\(\\log 10 = 1\\)." },
          { type: "word", q: "Expand \\(\\log(x y^3)\\).", answer: "\\(\\log x + 3 \\log y\\).", solution: "Product and power rules." },
          { type: "word", q: "Solve \\(\\log_4 x = 2\\).", answer: "\\(x = 16\\).", solution: "\\(x = 4^2\\)." }
        ]
      }
    },
    {
      id: "a4", num: 4, title: "Rational Functions", subtitle: "Asymptotes and graphs",
      emoji: "➗", accent: "#d97b7b", accent2: "#e9a8a8",
      sections: [
        {
          title: "Vertical Asymptotes",
          questions: [
            { type: "regular", q: "Vertical asymptote of \\(f(x) = \\dfrac{1}{x - 3}\\)?", answer: "\\(x = 3\\).", solution: "Denominator zero." },
            { type: "regular", q: "Vertical asymptote of \\(f(x) = \\dfrac{x+1}{x^2 - 4}\\)?", answer: "\\(x = \\pm 2\\).", solution: "\\(x^2 - 4 = 0\\)." },
            { type: "regular", q: "Does \\(f(x) = \\dfrac{x^2 - 1}{x - 1}\\) have a vertical asymptote at \\(x = 1\\)?", answer: "No (hole instead).", solution: "\\(x - 1\\) cancels." },
            { type: "regular", q: "Domain of \\(f(x) = \\dfrac{3}{x^2 - 9}\\)?", answer: "\\(x \\ne \\pm 3\\).", solution: "Denominator can't be 0." },
            { type: "word", q: "For what \\(x\\) does \\(f(x) = \\dfrac{2x}{x - 5}\\) blow up?", answer: "At \\(x = 5\\).", solution: "Denominator 0." }
          ]
        },
        {
          title: "Horizontal Asymptotes",
          questions: [
            { type: "regular", q: "Horizontal asymptote of \\(f(x) = \\dfrac{2x}{x + 1}\\)?", answer: "\\(y = 2\\).", solution: "Ratio of leading coefficients when degrees equal." },
            { type: "regular", q: "Horizontal asymptote of \\(f(x) = \\dfrac{x}{x^2 + 1}\\)?", answer: "\\(y = 0\\).", solution: "Bottom degree higher." },
            { type: "regular", q: "Horizontal asymptote of \\(f(x) = \\dfrac{x^3}{x^2}\\)?", answer: "None.", solution: "Top degree higher (slant or beyond)." },
            { type: "regular", q: "H.A. of \\(f(x) = \\dfrac{3x^2 + 2}{6x^2 - 5}\\)?", answer: "\\(y = \\tfrac{1}{2}\\).", solution: "Ratio of leading coeffs." },
            { type: "word", q: "A function \\(f(x) = \\dfrac{5x + 1}{x + 3}\\) approaches what value as \\(x \\to \\infty\\)?", answer: "5.", solution: "Ratio of leading coeffs." }
          ]
        },
        {
          title: "Solving Rational Equations",
          questions: [
            { type: "regular", q: "Solve \\(\\dfrac{1}{x} + \\dfrac{1}{2} = 1\\).", answer: "\\(x = 2\\).", solution: "\\(1/x = 1/2\\)." },
            { type: "regular", q: "Solve \\(\\dfrac{x}{x+1} = 2\\).", answer: "\\(x = -2\\).", solution: "\\(x = 2(x+1) = 2x + 2\\)." },
            { type: "regular", q: "Solve \\(\\dfrac{3}{x-2} = \\dfrac{6}{x+1}\\).", answer: "\\(x = 5\\).", solution: "Cross multiply: \\(3(x+1) = 6(x-2)\\)." },
            { type: "regular", q: "Why check answers in rational equations?", answer: "Some may be extraneous (make a denominator 0).", solution: "Domain restrictions matter." },
            { type: "word", q: "Two machines together finish in 6 hrs; one takes \\(x\\) hours alone, other \\(x+5\\). Equation?", answer: "\\(\\dfrac{1}{x} + \\dfrac{1}{x+5} = \\dfrac{1}{6}\\).", solution: "Rates add." }
          ]
        }
      ],
      cumulativeTest: {
        title: "Cumulative Test — Rational Functions",
        questions: [
          { type: "regular", q: "V.A. of \\(f(x) = \\dfrac{1}{x+4}\\)?", answer: "\\(x = -4\\).", solution: "Denominator 0." },
          { type: "regular", q: "H.A. of \\(f(x) = \\dfrac{x}{x+2}\\)?", answer: "\\(y = 1\\).", solution: "Equal degrees; ratio 1/1." },
          { type: "regular", q: "Domain of \\(\\dfrac{x}{x^2 - 1}\\)?", answer: "\\(x \\ne \\pm 1\\).", solution: "Factor \\(x^2 - 1\\)." },
          { type: "regular", q: "Solve \\(\\dfrac{2}{x} = \\dfrac{6}{x+4}\\).", answer: "\\(x = 2\\).", solution: "Cross multiply." },
          { type: "word", q: "H.A. of \\(\\dfrac{2x^2}{x^2 + 1}\\)?", answer: "\\(y = 2\\).", solution: "Ratio of leading coeffs." },
          { type: "word", q: "For what \\(x\\) is \\(\\dfrac{x}{x-7}\\) undefined?", answer: "\\(x = 7\\).", solution: "Denominator 0." }
        ]
      }
    },
    {
      id: "a5", num: 5, title: "Sequences and Series", subtitle: "Arithmetic, geometric, summation",
      emoji: "🔗", accent: "#b58a3a", accent2: "#d8b870",
      sections: [
        {
          title: "Arithmetic Sequences",
          questions: [
            { type: "regular", q: "Common difference of \\(2, 5, 8, 11, \\dots\\)?", answer: "3.", solution: "Subtract consecutive terms." },
            { type: "regular", q: "Find \\(a_{10}\\) if \\(a_1 = 4, d = 3\\).", answer: "31.", solution: "\\(a_n = a_1 + (n-1)d = 4 + 27\\)." },
            { type: "regular", q: "Write the formula for the \\(n\\)th term of an arithmetic sequence.", answer: "\\(a_n = a_1 + (n-1)d\\).", solution: "Standard arithmetic formula." },
            { type: "regular", q: "Sum of the first 10 terms if \\(a_1 = 1, d = 2\\)?", answer: "100.", solution: "\\(S_{10} = \\tfrac{10}{2}(2 + 20) \\cdot\\) — actually \\(S_n = \\tfrac{n}{2}(2a_1 + (n-1)d) = 5(2 + 18) = 100\\)." },
            { type: "word", q: "A staircase has 5 steps in row 1, 7 in row 2, 9 in row 3... How many in row 10?", answer: "23.", solution: "\\(a_{10} = 5 + 9(2) = 23\\)." }
          ]
        },
        {
          title: "Geometric Sequences",
          questions: [
            { type: "regular", q: "Common ratio of \\(3, 6, 12, 24, \\dots\\)?", answer: "2.", solution: "Divide consecutive terms." },
            { type: "regular", q: "\\(n\\)th term formula for geometric?", answer: "\\(a_n = a_1 \\cdot r^{n-1}\\).", solution: "Geometric general term." },
            { type: "regular", q: "Find \\(a_6\\) if \\(a_1 = 2, r = 3\\).", answer: "486.", solution: "\\(2 \\cdot 3^5 = 486\\)." },
            { type: "regular", q: "Sum of first \\(n\\) terms formula (geometric)?", answer: "\\(S_n = a_1 \\dfrac{1 - r^n}{1 - r}\\) for \\(r \\ne 1\\).", solution: "Standard formula." },
            { type: "word", q: "A ball bounces back to 60% of its height each time. Start 100 ft. Height after 3 bounces?", answer: "21.6 ft.", solution: "\\(100 \\cdot 0.6^3 = 21.6\\)." }
          ]
        },
        {
          title: "Series and Summation",
          questions: [
            { type: "regular", q: "Evaluate \\(\\sum_{k=1}^{5} k\\).", answer: "15.", solution: "\\(1+2+3+4+5\\)." },
            { type: "regular", q: "Evaluate \\(\\sum_{k=1}^{4} 2k\\).", answer: "20.", solution: "\\(2+4+6+8\\)." },
            { type: "regular", q: "Infinite sum \\(\\sum_{k=0}^{\\infty} (0.5)^k\\)?", answer: "2.", solution: "\\(\\dfrac{1}{1-0.5}\\)." },
            { type: "regular", q: "Does \\(\\sum_{k=0}^{\\infty} 2^k\\) converge?", answer: "No.", solution: "\\(|r| \\ge 1\\)." },
            { type: "word", q: "An infinite geometric series starts at 3 with ratio \\(\\tfrac{1}{3}\\). Sum?", answer: "\\(\\dfrac{9}{2} = 4.5\\).", solution: "\\(\\dfrac{3}{1-1/3} = \\dfrac{9}{2}\\)." }
          ]
        }
      ],
      cumulativeTest: {
        title: "Cumulative Test — Sequences and Series",
        questions: [
          { type: "regular", q: "Common difference of \\(10, 7, 4, 1, \\dots\\)?", answer: "\\(-3\\).", solution: "Subtract." },
          { type: "regular", q: "Common ratio of \\(4, 12, 36, \\dots\\)?", answer: "3.", solution: "Divide." },
          { type: "regular", q: "\\(a_8\\) for arithmetic \\(a_1 = 2, d = 5\\)?", answer: "37.", solution: "\\(2 + 35\\)." },
          { type: "regular", q: "Evaluate \\(\\sum_{k=1}^3 k^2\\).", answer: "14.", solution: "\\(1+4+9\\)." },
          { type: "word", q: "Geometric: \\(a_1 = 5, r = 2\\). Find \\(a_4\\).", answer: "40.", solution: "\\(5 \\cdot 2^3 = 40\\)." },
          { type: "word", q: "Infinite sum of \\(6 + 2 + \\tfrac{2}{3} + \\cdots\\)?", answer: "9.", solution: "\\(\\dfrac{6}{1-1/3} = 9\\)." }
        ]
      }
    },
    {
      id: "a6", num: 6, title: "Conic Sections", subtitle: "Circles, parabolas, ellipses, hyperbolas",
      emoji: "🌀", accent: "#566fb0", accent2: "#97a7d3",
      sections: [
        {
          title: "Circles",
          questions: [
            { type: "regular", q: "Standard form of a circle with center \\((h, k)\\) and radius \\(r\\)?", answer: "\\((x-h)^2 + (y-k)^2 = r^2\\).", solution: "Standard form." },
            { type: "regular", q: "Find the center and radius of \\((x-2)^2 + (y+3)^2 = 25\\).", answer: "Center \\((2, -3)\\), radius 5.", solution: "Read off." },
            { type: "regular", q: "Equation of circle centered at origin with radius 4?", answer: "\\(x^2 + y^2 = 16\\).", solution: "\\(r^2 = 16\\)." },
            { type: "regular", q: "Is \\((3, 4)\\) on the circle \\(x^2 + y^2 = 25\\)?", answer: "Yes.", solution: "\\(9 + 16 = 25\\)." },
            { type: "word", q: "A Ferris wheel has center 20 ft up and radius 15. Equation in xy-plane?", answer: "\\(x^2 + (y-20)^2 = 225\\).", solution: "Plug into standard form." }
          ]
        },
        {
          title: "Parabolas",
          questions: [
            { type: "regular", q: "Focus and directrix of \\(x^2 = 4y\\)?", answer: "Focus \\((0, 1)\\), directrix \\(y = -1\\).", solution: "\\(4p = 4 \\Rightarrow p = 1\\)." },
            { type: "regular", q: "Which direction opens \\(y = -x^2\\)?", answer: "Down.", solution: "Negative coefficient." },
            { type: "regular", q: "Vertex of \\(y = (x+3)^2 - 5\\)?", answer: "\\((-3, -5)\\).", solution: "Vertex form." },
            { type: "regular", q: "Axis of symmetry of \\(x^2 = 8y\\)?", answer: "\\(x = 0\\) (y-axis).", solution: "Standard position." },
            { type: "word", q: "A satellite dish's cross-section is \\(y = \\tfrac{1}{8}x^2\\). Where is the focus?", answer: "\\((0, 2)\\).", solution: "\\(y = \\tfrac{1}{4p}x^2 \\Rightarrow p = 2\\)." }
          ]
        },
        {
          title: "Ellipses and Hyperbolas",
          questions: [
            { type: "regular", q: "Standard form of an ellipse centered at origin?", answer: "\\(\\dfrac{x^2}{a^2} + \\dfrac{y^2}{b^2} = 1\\).", solution: "Sum = 1." },
            { type: "regular", q: "Standard form of a hyperbola centered at origin?", answer: "\\(\\dfrac{x^2}{a^2} - \\dfrac{y^2}{b^2} = 1\\) (or the \\(y\\)-opening form).", solution: "Difference = 1." },
            { type: "regular", q: "Find the semi-major axis \\(a\\) of \\(\\dfrac{x^2}{25} + \\dfrac{y^2}{9} = 1\\).", answer: "5.", solution: "\\(\\sqrt{25}\\)." },
            { type: "regular", q: "The foci of an ellipse \\(\\dfrac{x^2}{a^2} + \\dfrac{y^2}{b^2} = 1\\) (\\(a > b\\)) are at?", answer: "\\((\\pm c, 0)\\) where \\(c^2 = a^2 - b^2\\).", solution: "Ellipse foci formula." },
            { type: "word", q: "For the ellipse \\(\\dfrac{x^2}{100} + \\dfrac{y^2}{36} = 1\\), find \\(c\\).", answer: "8.", solution: "\\(c^2 = 100 - 36 = 64\\)." }
          ]
        }
      ],
      cumulativeTest: {
        title: "Cumulative Test — Conic Sections",
        questions: [
          { type: "regular", q: "Radius of \\(x^2 + y^2 = 49\\)?", answer: "7.", solution: "\\(r^2 = 49\\)." },
          { type: "regular", q: "Vertex of \\(y = (x-2)^2 + 4\\)?", answer: "\\((2, 4)\\).", solution: "Vertex form." },
          { type: "regular", q: "Is \\(\\dfrac{x^2}{9} + \\dfrac{y^2}{16} = 1\\) an ellipse or hyperbola?", answer: "Ellipse.", solution: "Plus sign, equals 1." },
          { type: "regular", q: "Center of \\((x+3)^2 + (y-5)^2 = 16\\)?", answer: "\\((-3, 5)\\).", solution: "Flip signs." },
          { type: "word", q: "Does \\(\\dfrac{x^2}{25} - \\dfrac{y^2}{9} = 1\\) open horizontally or vertically?", answer: "Horizontally.", solution: "\\(x^2\\) term positive." },
          { type: "word", q: "Circle passing through origin with center \\((3, 4)\\) — find radius.", answer: "5.", solution: "\\(\\sqrt{9 + 16}\\)." }
        ]
      }
    },
    {
      id: "a7", num: 7, title: "Trigonometry", subtitle: "Unit circle, identities, equations",
      emoji: "📐", accent: "#6a8f6a", accent2: "#a8c09a",
      sections: [
        {
          title: "Unit Circle",
          questions: [
            { type: "regular", q: "\\(\\sin 0\\)?", answer: "0.", solution: "Unit circle at \\((1, 0)\\)." },
            { type: "regular", q: "\\(\\cos 90°\\)?", answer: "0.", solution: "At \\((0, 1)\\)." },
            { type: "regular", q: "\\(\\sin 30°\\)?", answer: "\\(\\tfrac{1}{2}\\).", solution: "Standard value." },
            { type: "regular", q: "\\(\\cos 60°\\)?", answer: "\\(\\tfrac{1}{2}\\).", solution: "Standard value." },
            { type: "word", q: "Convert \\(45°\\) to radians.", answer: "\\(\\dfrac{\\pi}{4}\\).", solution: "\\(45 \\cdot \\dfrac{\\pi}{180}\\)." }
          ]
        },
        {
          title: "Identities",
          questions: [
            { type: "regular", q: "Pythagorean identity?", answer: "\\(\\sin^2\\theta + \\cos^2\\theta = 1\\).", solution: "Fundamental identity." },
            { type: "regular", q: "If \\(\\sin\\theta = \\tfrac{3}{5}\\) and \\(\\theta\\) is in QI, find \\(\\cos\\theta\\).", answer: "\\(\\tfrac{4}{5}\\).", solution: "\\(\\cos^2 = 1 - 9/25 = 16/25\\)." },
            { type: "regular", q: "Simplify \\(\\dfrac{\\sin\\theta}{\\cos\\theta}\\).", answer: "\\(\\tan\\theta\\).", solution: "Definition of tangent." },
            { type: "regular", q: "\\(\\tan 45°\\)?", answer: "1.", solution: "\\(\\sin 45 / \\cos 45 = 1\\)." },
            { type: "word", q: "Why is \\(\\sin^2 + \\cos^2 = 1\\)? Relate to unit circle.", answer: "Because on a unit circle, \\(x^2 + y^2 = 1\\) and \\(x = \\cos\\theta, y = \\sin\\theta\\).", solution: "Definition." }
          ]
        },
        {
          title: "Trig Equations",
          questions: [
            { type: "regular", q: "Solve \\(\\sin\\theta = \\tfrac{1}{2}\\) in \\([0°, 360°)\\).", answer: "\\(30°, 150°\\).", solution: "Two angles give sine 1/2." },
            { type: "regular", q: "Solve \\(\\cos\\theta = 0\\) in \\([0°, 360°)\\).", answer: "\\(90°, 270°\\).", solution: "y-axis intersections." },
            { type: "regular", q: "Solve \\(\\tan\\theta = 1\\) in \\([0°, 360°)\\).", answer: "\\(45°, 225°\\).", solution: "Where sin = cos." },
            { type: "regular", q: "Solve \\(2\\sin\\theta - 1 = 0\\) in \\([0°, 360°)\\).", answer: "\\(30°, 150°\\).", solution: "\\(\\sin\\theta = 1/2\\)." },
            { type: "word", q: "Ferris wheel height \\(h = 30 + 20\\sin\\theta\\). At what angle is it 50 ft?", answer: "\\(90°\\).", solution: "\\(20\\sin\\theta = 20\\)." }
          ]
        }
      ],
      cumulativeTest: {
        title: "Cumulative Test — Trigonometry",
        questions: [
          { type: "regular", q: "\\(\\sin 90°\\)?", answer: "1.", solution: "Unit circle." },
          { type: "regular", q: "\\(\\cos 180°\\)?", answer: "\\(-1\\).", solution: "At \\((-1, 0)\\)." },
          { type: "regular", q: "\\(\\tan 0\\)?", answer: "0.", solution: "\\(\\sin 0 / \\cos 0 = 0\\)." },
          { type: "regular", q: "If \\(\\cos\\theta = \\tfrac{5}{13}\\) and QI, \\(\\sin\\theta\\)?", answer: "\\(\\tfrac{12}{13}\\).", solution: "Pythagorean identity." },
          { type: "word", q: "Convert \\(\\dfrac{\\pi}{3}\\) to degrees.", answer: "\\(60°\\).", solution: "\\(\\dfrac{\\pi}{3} \\cdot \\dfrac{180}{\\pi}\\)." },
          { type: "word", q: "Solve \\(\\cos\\theta = -\\tfrac{1}{2}\\) in \\([0°, 360°)\\).", answer: "\\(120°, 240°\\).", solution: "Cos is \\(-1/2\\) there." }
        ]
      }
    },
    {
      id: "a8", num: 8, title: "Statistics & Probability", subtitle: "Data, distributions, combinatorics",
      emoji: "📊", accent: "#c29449", accent2: "#e3be85",
      sections: [
        {
          title: "Descriptive Statistics",
          questions: [
            { type: "regular", q: "Mean of \\(5, 8, 12, 15\\)?", answer: "10.", solution: "\\(40 / 4\\)." },
            { type: "regular", q: "Median of \\(3, 7, 2, 9, 5\\)?", answer: "5.", solution: "Sort \\(2, 3, 5, 7, 9\\); middle is 5." },
            { type: "regular", q: "Mode of \\(2, 4, 4, 5, 6, 4, 7\\)?", answer: "4.", solution: "Most frequent." },
            { type: "regular", q: "Range of \\(10, 25, 18, 7, 30\\)?", answer: "23.", solution: "\\(30 - 7\\)." },
            { type: "word", q: "A class quiz has scores 70, 80, 85, 90, 95. Mean?", answer: "84.", solution: "Sum 420 / 5." }
          ]
        },
        {
          title: "Combinations and Permutations",
          questions: [
            { type: "regular", q: "\\(5!\\)?", answer: "120.", solution: "\\(5 \\cdot 4 \\cdot 3 \\cdot 2 \\cdot 1\\)." },
            { type: "regular", q: "\\(\\binom{6}{2}\\)?", answer: "15.", solution: "\\(\\dfrac{6!}{2!4!}\\)." },
            { type: "regular", q: "Permutations of 4 items?", answer: "24.", solution: "\\(4!\\)." },
            { type: "regular", q: "Does order matter for combinations?", answer: "No.", solution: "Combinations = unordered selections." },
            { type: "word", q: "How many ways to arrange 5 books on a shelf?", answer: "120.", solution: "\\(5!\\)." }
          ]
        },
        {
          title: "Probability Distributions",
          questions: [
            { type: "regular", q: "Rolling a die, P(even)?", answer: "\\(\\tfrac{1}{2}\\).", solution: "3 out of 6." },
            { type: "regular", q: "Two coin flips, P(both heads)?", answer: "\\(\\tfrac{1}{4}\\).", solution: "\\(\\tfrac{1}{2} \\cdot \\tfrac{1}{2}\\)." },
            { type: "regular", q: "Expected value of a fair die roll?", answer: "3.5.", solution: "\\((1+2+3+4+5+6)/6\\)." },
            { type: "regular", q: "Sum of all probabilities in a distribution?", answer: "1.", solution: "All outcomes." },
            { type: "word", q: "A card drawn from a deck — probability it's a heart given it's red?", answer: "\\(\\tfrac{1}{2}\\).", solution: "Hearts are half the red cards." }
          ]
        }
      ],
      cumulativeTest: {
        title: "Cumulative Test — Statistics & Probability",
        questions: [
          { type: "regular", q: "Mean of \\(4, 6, 8, 10\\)?", answer: "7.", solution: "Sum 28 / 4." },
          { type: "regular", q: "Median of \\(2, 5, 8, 11\\)?", answer: "6.5.", solution: "Average of middle two." },
          { type: "regular", q: "\\(\\binom{5}{3}\\)?", answer: "10.", solution: "\\(5!/(3! \\cdot 2!)\\)." },
          { type: "regular", q: "P(rolling 6 on a die)?", answer: "\\(\\tfrac{1}{6}\\).", solution: "Basic." },
          { type: "word", q: "How many 3-letter arrangements from ABCDE with no repeats?", answer: "60.", solution: "\\(5 \\cdot 4 \\cdot 3\\)." },
          { type: "word", q: "Probability two coins both land tails?", answer: "\\(\\tfrac{1}{4}\\).", solution: "\\(\\tfrac{1}{2}^2\\)." }
        ]
      }
    },
    {
      id: "a9", num: 9, title: "Complex Numbers", subtitle: "Imaginary units and arithmetic",
      emoji: "✨", accent: "#5b8da8", accent2: "#9fbfd1",
      sections: [
        {
          title: "Basics of i",
          questions: [
            { type: "regular", q: "Simplify \\(i^2\\).", answer: "\\(-1\\).", solution: "Definition." },
            { type: "regular", q: "Simplify \\(i^3\\).", answer: "\\(-i\\).", solution: "\\(i^2 \\cdot i\\)." },
            { type: "regular", q: "Simplify \\(i^{4}\\).", answer: "1.", solution: "\\(i^4 = 1\\)." },
            { type: "regular", q: "Write \\(\\sqrt{-16}\\) as a complex number.", answer: "\\(4i\\).", solution: "\\(\\sqrt{-1 \\cdot 16}\\)." },
            { type: "word", q: "Simplify \\(i^{15}\\).", answer: "\\(-i\\).", solution: "\\(i^{15} = i^{12} \\cdot i^3 = i^3 = -i\\)." }
          ]
        },
        {
          title: "Arithmetic with Complex Numbers",
          questions: [
            { type: "regular", q: "\\((3 + 2i) + (4 - 5i)\\)?", answer: "\\(7 - 3i\\).", solution: "Combine real and imaginary." },
            { type: "regular", q: "\\((2 + i)(3 - i)\\)?", answer: "\\(7 + i\\).", solution: "FOIL: \\(6 - 2i + 3i - i^2 = 6 + i + 1\\)." },
            { type: "regular", q: "\\((1 + i)^2\\)?", answer: "\\(2i\\).", solution: "\\(1 + 2i + i^2 = 1 + 2i - 1\\)." },
            { type: "regular", q: "Conjugate of \\(5 - 3i\\)?", answer: "\\(5 + 3i\\).", solution: "Flip sign of imaginary part." },
            { type: "word", q: "\\((2 - i)(2 + i)\\)?", answer: "5.", solution: "Difference of squares: \\(4 - i^2 = 5\\)." }
          ]
        },
        {
          title: "Division and Conjugates",
          questions: [
            { type: "regular", q: "Simplify \\(\\dfrac{1}{i}\\).", answer: "\\(-i\\).", solution: "Multiply by \\(-i/-i\\) or \\(i/i\\): \\(\\dfrac{i}{i^2} = -i\\)." },
            { type: "regular", q: "Simplify \\(\\dfrac{4}{2 + i}\\).", answer: "\\(\\dfrac{8 - 4i}{5}\\).", solution: "Multiply by conjugate \\(2 - i\\)." },
            { type: "regular", q: "Simplify \\(\\dfrac{3 + i}{1 - i}\\).", answer: "\\(1 + 2i\\).", solution: "Multiply by \\(\\dfrac{1+i}{1+i}\\)." },
            { type: "regular", q: "Magnitude (modulus) of \\(3 + 4i\\)?", answer: "5.", solution: "\\(\\sqrt{9 + 16}\\)." },
            { type: "word", q: "Why multiply by the conjugate when dividing?", answer: "To clear the imaginary part from the denominator.", solution: "\\((a+bi)(a-bi) = a^2 + b^2\\) is real." }
          ]
        }
      ],
      cumulativeTest: {
        title: "Cumulative Test — Complex Numbers",
        questions: [
          { type: "regular", q: "\\(\\sqrt{-81}\\)?", answer: "\\(9i\\).", solution: "\\(\\sqrt{-1 \\cdot 81}\\)." },
          { type: "regular", q: "\\((2 + 3i) + (1 - 4i)\\)?", answer: "\\(3 - i\\).", solution: "Combine." },
          { type: "regular", q: "\\((1 + i)(1 - i)\\)?", answer: "2.", solution: "\\(1 - i^2\\)." },
          { type: "regular", q: "\\(i^{25}\\)?", answer: "\\(i\\).", solution: "\\(i^{24} \\cdot i = 1 \\cdot i\\)." },
          { type: "word", q: "Magnitude of \\(6 + 8i\\)?", answer: "10.", solution: "\\(\\sqrt{36 + 64}\\)." },
          { type: "word", q: "Conjugate of \\(2 + 7i\\)?", answer: "\\(2 - 7i\\).", solution: "Flip imaginary sign." }
        ]
      }
    }
  ]
};
