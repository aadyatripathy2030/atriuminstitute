// Pre-Calculus course — focused on topics that bridge Algebra 2 to Calculus.
const PRECALC_COURSE = {
  id: "precalc",
  title: "Pre-Calculus",
  subtitle: "Trigonometry, vectors, limits, and the bridge to calculus",
  emoji: "🧭",
  accent: "#0e7490",
  accent2: "#67c2d6",
  description: "Nine topics taking functions, trigonometry, vectors, polar, matrices, and limits to a deeper level.",
  books: [
    {
      id: "pc1", num: 1, title: "Advanced Functions", subtitle: "Composition, inverses, transformations",
      emoji: "🔁", accent: "#0e7490", accent2: "#67c2d6",
      sections: [
        {
          title: "Composition of Functions",
          questions: [
            { type: "regular", q: "If \\(f(x) = 2x + 1\\) and \\(g(x) = x^2\\), find \\((f \\circ g)(3)\\).", answer: "19.", solution: "\\(f(g(3)) = f(9) = 19\\)." },
            { type: "regular", q: "If \\(f(x) = x + 5\\), \\(g(x) = 3x\\), find \\((g \\circ f)(x)\\).", answer: "\\(3x + 15\\).", solution: "\\(g(x+5)\\)." },
            { type: "regular", q: "Does \\((f \\circ g)(x) = (g \\circ f)(x)\\) in general?", answer: "No — composition isn't commutative.", solution: "Order matters." },
            { type: "regular", q: "Domain of \\((f \\circ g)\\) where \\(f(x) = \\sqrt{x}\\), \\(g(x) = x - 4\\)?", answer: "\\(x \\geq 4\\).", solution: "Need \\(g(x) \\geq 0\\)." },
            { type: "word", q: "A store marks up cost by 40% and then offers 10% off. Write the final price as a composition, starting from cost \\(c\\).", answer: "\\(0.9(1.4c) = 1.26c\\).", solution: "Two successive transformations." }
          ]
        },
        {
          title: "Inverse Functions",
          questions: [
            { type: "regular", q: "Find the inverse of \\(f(x) = 2x - 4\\).", answer: "\\(f^{-1}(x) = \\dfrac{x+4}{2}\\).", solution: "Swap \\(x, y\\); solve." },
            { type: "regular", q: "Is \\(f(x) = x^2\\) one-to-one on all reals?", answer: "No.", solution: "Fails horizontal-line test." },
            { type: "regular", q: "If \\(f^{-1}(x) = 3x + 1\\), find \\(f(x)\\).", answer: "\\(f(x) = \\dfrac{x-1}{3}\\).", solution: "Invert the inverse." },
            { type: "regular", q: "What is \\((f \\circ f^{-1})(x)\\)?", answer: "\\(x\\).", solution: "Inverses cancel." },
            { type: "word", q: "A temperature-conversion function is \\(F = \\tfrac{9}{5}C + 32\\). Find the inverse.", answer: "\\(C = \\tfrac{5}{9}(F - 32)\\).", solution: "Solve for \\(C\\)." }
          ]
        },
        {
          title: "Transformations of Graphs",
          questions: [
            { type: "regular", q: "How does \\(g(x) = f(x) + 3\\) differ from \\(f(x)\\)?", answer: "Shifted up 3.", solution: "Vertical translation." },
            { type: "regular", q: "What does \\(g(x) = f(x - 2)\\) do to the graph of \\(f\\)?", answer: "Shifts right 2.", solution: "Horizontal translation." },
            { type: "regular", q: "What does \\(g(x) = -f(x)\\) do?", answer: "Reflects across the x-axis.", solution: "Negation reflects vertically." },
            { type: "regular", q: "Describe \\(g(x) = 2f(x)\\).", answer: "Vertical stretch by factor 2.", solution: "Scales \\(y\\)-values." },
            { type: "word", q: "Start with \\(f(x) = x^2\\). Describe the graph of \\(g(x) = -(x-3)^2 + 5\\).", answer: "Shifted right 3, up 5, reflected over the x-axis.", solution: "Read off transformations." }
          ]
        }
      ],
      cumulativeTest: {
        title: "Cumulative Test — Advanced Functions",
        questions: [
          { type: "regular", q: "If \\(f(x) = x + 2\\), \\(g(x) = x^2\\), find \\((f \\circ g)(x)\\).", answer: "\\(x^2 + 2\\).", solution: "\\(f(x^2)\\)." },
          { type: "regular", q: "Inverse of \\(f(x) = 4x - 8\\)?", answer: "\\(\\dfrac{x+8}{4}\\).", solution: "Swap and solve." },
          { type: "regular", q: "Describe \\(g(x) = f(x+4)\\).", answer: "Shift left 4.", solution: "Horizontal translation." },
          { type: "regular", q: "Is \\(f(x) = x^3\\) one-to-one?", answer: "Yes.", solution: "Passes horizontal-line test." },
          { type: "word", q: "Given \\(f(x) = 3x\\), find \\(f(f(f(2)))\\).", answer: "54.", solution: "\\(3 \\to 6 \\to 18 \\to 54\\)." },
          { type: "word", q: "A graph is stretched vertically by 3 and shifted down 2. Write \\(g\\) in terms of \\(f\\).", answer: "\\(g(x) = 3f(x) - 2\\).", solution: "Combine transformations." }
        ]
      }
    },
    {
      id: "pc2", num: 2, title: "Trig Functions & Unit Circle", subtitle: "Radians, angles, exact values",
      emoji: "🔄", accent: "#1a856e", accent2: "#6cc1af",
      sections: [
        {
          title: "Angles and Radians",
          questions: [
            { type: "regular", q: "Convert \\(90°\\) to radians.", answer: "\\(\\dfrac{\\pi}{2}\\).", solution: "\\(90 \\cdot \\dfrac{\\pi}{180}\\)." },
            { type: "regular", q: "Convert \\(\\dfrac{\\pi}{6}\\) to degrees.", answer: "\\(30°\\).", solution: "\\(\\dfrac{\\pi}{6} \\cdot \\dfrac{180}{\\pi}\\)." },
            { type: "regular", q: "How many radians in a full circle?", answer: "\\(2\\pi\\).", solution: "Definition." },
            { type: "regular", q: "What's the reference angle for \\(210°\\)?", answer: "\\(30°\\).", solution: "\\(210 - 180\\)." },
            { type: "word", q: "Convert \\(\\dfrac{3\\pi}{4}\\) radians to degrees.", answer: "\\(135°\\).", solution: "\\(\\dfrac{3}{4} \\cdot 180\\)." }
          ]
        },
        {
          title: "Unit Circle Values",
          questions: [
            { type: "regular", q: "\\(\\sin\\left(\\dfrac{\\pi}{3}\\right)\\)?", answer: "\\(\\dfrac{\\sqrt{3}}{2}\\).", solution: "Standard \\(60°\\) value." },
            { type: "regular", q: "\\(\\cos\\left(\\dfrac{\\pi}{4}\\right)\\)?", answer: "\\(\\dfrac{\\sqrt{2}}{2}\\).", solution: "Standard \\(45°\\) value." },
            { type: "regular", q: "\\(\\tan\\left(\\dfrac{\\pi}{4}\\right)\\)?", answer: "1.", solution: "\\(\\sin = \\cos\\) at \\(45°\\)." },
            { type: "regular", q: "\\(\\sin(\\pi)\\)?", answer: "0.", solution: "At \\((-1, 0)\\)." },
            { type: "word", q: "\\(\\cos\\left(\\dfrac{5\\pi}{6}\\right)\\)?", answer: "\\(-\\dfrac{\\sqrt{3}}{2}\\).", solution: "QII reference angle \\(\\pi/6\\); cosine negative." }
          ]
        },
        {
          title: "Reciprocal Trig Functions",
          questions: [
            { type: "regular", q: "Define \\(\\sec\\theta\\).", answer: "\\(\\sec\\theta = \\dfrac{1}{\\cos\\theta}\\).", solution: "Reciprocal of cosine." },
            { type: "regular", q: "Define \\(\\csc\\theta\\).", answer: "\\(\\csc\\theta = \\dfrac{1}{\\sin\\theta}\\).", solution: "Reciprocal of sine." },
            { type: "regular", q: "\\(\\cot\\left(\\dfrac{\\pi}{4}\\right)\\)?", answer: "1.", solution: "\\(1/\\tan(\\pi/4) = 1\\)." },
            { type: "regular", q: "\\(\\sec(0)\\)?", answer: "1.", solution: "\\(1/\\cos 0 = 1/1\\)." },
            { type: "word", q: "Where is \\(\\sec\\theta\\) undefined in \\([0, 2\\pi)\\)?", answer: "\\(\\theta = \\pi/2\\) and \\(3\\pi/2\\).", solution: "Where \\(\\cos\\theta = 0\\)." }
          ]
        }
      ],
      cumulativeTest: {
        title: "Cumulative Test — Trig Functions & Unit Circle",
        questions: [
          { type: "regular", q: "Convert \\(60°\\) to radians.", answer: "\\(\\dfrac{\\pi}{3}\\).", solution: "\\(60/180 \\cdot \\pi\\)." },
          { type: "regular", q: "\\(\\sin(\\pi/2)\\)?", answer: "1.", solution: "At \\((0,1)\\)." },
          { type: "regular", q: "\\(\\cos(2\\pi/3)\\)?", answer: "\\(-\\dfrac{1}{2}\\).", solution: "Reference \\(\\pi/3\\), QII negative." },
          { type: "regular", q: "\\(\\tan(0)\\)?", answer: "0.", solution: "Sine zero there." },
          { type: "word", q: "Convert \\(\\dfrac{7\\pi}{6}\\) to degrees.", answer: "\\(210°\\).", solution: "\\(7/6 \\cdot 180\\)." },
          { type: "word", q: "Reference angle for \\(315°\\)?", answer: "\\(45°\\).", solution: "\\(360 - 315\\)." }
        ]
      }
    },
    {
      id: "pc3", num: 3, title: "Graphs of Trig Functions", subtitle: "Amplitude, period, phase shift",
      emoji: "🌊", accent: "#9333ea", accent2: "#cca4f5",
      sections: [
        {
          title: "Sine and Cosine Graphs",
          questions: [
            { type: "regular", q: "Amplitude of \\(y = 4\\sin x\\)?", answer: "4.", solution: "Leading coefficient." },
            { type: "regular", q: "Period of \\(y = \\sin(2x)\\)?", answer: "\\(\\pi\\).", solution: "\\(2\\pi / |B|\\)." },
            { type: "regular", q: "Midline of \\(y = \\sin x + 3\\)?", answer: "\\(y = 3\\).", solution: "Vertical shift." },
            { type: "regular", q: "Period of \\(y = \\cos\\left(\\dfrac{x}{2}\\right)\\)?", answer: "\\(4\\pi\\).", solution: "\\(2\\pi / (1/2)\\)." },
            { type: "word", q: "A tide follows \\(h(t) = 5\\sin(\\pi t/6) + 10\\). Amplitude and midline?", answer: "Amplitude 5, midline 10.", solution: "Read off coefficients." }
          ]
        },
        {
          title: "Tangent and Reciprocal Graphs",
          questions: [
            { type: "regular", q: "Period of \\(\\tan x\\)?", answer: "\\(\\pi\\).", solution: "Smaller than sine/cosine." },
            { type: "regular", q: "Vertical asymptotes of \\(\\tan x\\) in \\([0, 2\\pi)\\)?", answer: "\\(x = \\pi/2, 3\\pi/2\\).", solution: "Where \\(\\cos x = 0\\)." },
            { type: "regular", q: "Range of \\(\\tan x\\)?", answer: "All real numbers.", solution: "No bound." },
            { type: "regular", q: "Period of \\(\\tan(3x)\\)?", answer: "\\(\\dfrac{\\pi}{3}\\).", solution: "\\(\\pi / 3\\)." },
            { type: "word", q: "Why does \\(\\tan x\\) have vertical asymptotes?", answer: "Because \\(\\cos x = 0\\) in the denominator.", solution: "\\(\\tan = \\sin/\\cos\\)." }
          ]
        },
        {
          title: "Phase Shifts",
          questions: [
            { type: "regular", q: "Phase shift of \\(y = \\sin(x - \\pi/3)\\)?", answer: "Right \\(\\pi/3\\).", solution: "Horizontal shift." },
            { type: "regular", q: "Phase shift of \\(y = \\cos(2x + \\pi)\\)?", answer: "Left \\(\\pi/2\\).", solution: "\\(-\\pi / 2\\); left shift." },
            { type: "regular", q: "Describe \\(y = -\\sin x\\).", answer: "Sine reflected over x-axis.", solution: "Negation reflects vertically." },
            { type: "regular", q: "Midline of \\(y = 3\\cos x - 2\\)?", answer: "\\(y = -2\\).", solution: "Vertical shift down 2." },
            { type: "word", q: "Transform \\(\\sin x\\) into \\(y = 2\\sin(x + \\pi/4) + 1\\). Describe each change.", answer: "Stretch vertically 2, shift left \\(\\pi/4\\), shift up 1.", solution: "Read coefficients." }
          ]
        }
      ],
      cumulativeTest: {
        title: "Cumulative Test — Graphs of Trig Functions",
        questions: [
          { type: "regular", q: "Amplitude of \\(y = -3\\cos x\\)?", answer: "3.", solution: "Absolute value." },
          { type: "regular", q: "Period of \\(y = \\sin(4x)\\)?", answer: "\\(\\dfrac{\\pi}{2}\\).", solution: "\\(2\\pi / 4\\)." },
          { type: "regular", q: "Midline of \\(y = \\cos x - 5\\)?", answer: "\\(y = -5\\).", solution: "Shift." },
          { type: "regular", q: "Period of \\(\\tan x\\)?", answer: "\\(\\pi\\).", solution: "Standard." },
          { type: "word", q: "Describe \\(y = 2\\sin(x - \\pi) + 3\\).", answer: "Amplitude 2, shift right \\(\\pi\\), up 3.", solution: "Read off." },
          { type: "word", q: "Range of \\(y = 3\\sin x + 2\\)?", answer: "\\([-1, 5]\\).", solution: "Midline 2, amplitude 3." }
        ]
      }
    },
    {
      id: "pc4", num: 4, title: "Trig Identities", subtitle: "Sum, difference, double angle",
      emoji: "🧩", accent: "#db2777", accent2: "#f29cc7",
      sections: [
        {
          title: "Pythagorean and Reciprocal Identities",
          questions: [
            { type: "regular", q: "Simplify \\(1 - \\sin^2\\theta\\).", answer: "\\(\\cos^2\\theta\\).", solution: "Pythagorean identity." },
            { type: "regular", q: "Simplify \\(\\sec^2\\theta - 1\\).", answer: "\\(\\tan^2\\theta\\).", solution: "Pythagorean identity." },
            { type: "regular", q: "If \\(\\sin\\theta = \\tfrac{2}{3}\\) in QI, find \\(\\cos\\theta\\).", answer: "\\(\\dfrac{\\sqrt{5}}{3}\\).", solution: "\\(\\cos^2 = 1 - 4/9\\)." },
            { type: "regular", q: "Simplify \\(\\sin\\theta \\cdot \\csc\\theta\\).", answer: "1.", solution: "Reciprocals." },
            { type: "word", q: "Verify: \\(\\tan\\theta \\cdot \\cos\\theta = \\sin\\theta\\).", answer: "True — \\(\\dfrac{\\sin}{\\cos} \\cdot \\cos = \\sin\\).", solution: "Substitute definition." }
          ]
        },
        {
          title: "Sum and Difference Formulas",
          questions: [
            { type: "regular", q: "\\(\\sin(A + B)\\)?", answer: "\\(\\sin A \\cos B + \\cos A \\sin B\\).", solution: "Sum formula." },
            { type: "regular", q: "\\(\\cos(A - B)\\)?", answer: "\\(\\cos A \\cos B + \\sin A \\sin B\\).", solution: "Difference formula." },
            { type: "regular", q: "Find \\(\\sin(75°)\\) using \\(45° + 30°\\).", answer: "\\(\\dfrac{\\sqrt{6} + \\sqrt{2}}{4}\\).", solution: "Apply sum formula with known values." },
            { type: "regular", q: "Find \\(\\cos(15°)\\) using \\(45° - 30°\\).", answer: "\\(\\dfrac{\\sqrt{6} + \\sqrt{2}}{4}\\).", solution: "Apply difference formula." },
            { type: "word", q: "Using \\(\\tan(A + B) = \\dfrac{\\tan A + \\tan B}{1 - \\tan A \\tan B}\\), find \\(\\tan(75°)\\).", answer: "\\(2 + \\sqrt{3}\\).", solution: "Apply with \\(A = 45°, B = 30°\\)." }
          ]
        },
        {
          title: "Double-Angle Formulas",
          questions: [
            { type: "regular", q: "\\(\\sin(2\\theta)\\)?", answer: "\\(2\\sin\\theta \\cos\\theta\\).", solution: "Double-angle." },
            { type: "regular", q: "Three forms of \\(\\cos(2\\theta)\\)?", answer: "\\(\\cos^2 - \\sin^2\\), \\(1 - 2\\sin^2\\), \\(2\\cos^2 - 1\\).", solution: "Equivalent forms." },
            { type: "regular", q: "If \\(\\sin\\theta = \\tfrac{3}{5}\\) (QI), find \\(\\sin(2\\theta)\\).", answer: "\\(\\dfrac{24}{25}\\).", solution: "\\(\\cos\\theta = 4/5\\); \\(2 \\cdot \\tfrac{3}{5} \\cdot \\tfrac{4}{5}\\)." },
            { type: "regular", q: "\\(\\tan(2\\theta)\\) formula?", answer: "\\(\\dfrac{2\\tan\\theta}{1 - \\tan^2\\theta}\\).", solution: "Double-angle." },
            { type: "word", q: "If \\(\\cos\\theta = \\tfrac{1}{2}\\), find \\(\\cos(2\\theta)\\).", answer: "\\(-\\dfrac{1}{2}\\).", solution: "\\(2(1/4) - 1 = -1/2\\)." }
          ]
        }
      ],
      cumulativeTest: {
        title: "Cumulative Test — Trig Identities",
        questions: [
          { type: "regular", q: "\\(\\cos^2\\theta + \\sin^2\\theta\\)?", answer: "1.", solution: "Identity." },
          { type: "regular", q: "\\(\\sin(2\\theta)\\)?", answer: "\\(2\\sin\\theta\\cos\\theta\\).", solution: "Double-angle." },
          { type: "regular", q: "\\(\\tan\\theta \\cdot \\cot\\theta\\)?", answer: "1.", solution: "Reciprocal." },
          { type: "regular", q: "\\(\\cos(A+B)\\) formula?", answer: "\\(\\cos A\\cos B - \\sin A\\sin B\\).", solution: "Sum formula." },
          { type: "word", q: "Verify: \\(\\dfrac{\\sin\\theta}{\\cos\\theta} = \\tan\\theta\\).", answer: "True by definition.", solution: "Definition." },
          { type: "word", q: "\\(\\sin\\theta = \\tfrac{1}{2}\\) in QII. Find \\(\\cos\\theta\\).", answer: "\\(-\\dfrac{\\sqrt{3}}{2}\\).", solution: "Pythagorean, negative in QII." }
        ]
      }
    },
    {
      id: "pc5", num: 5, title: "Law of Sines & Cosines", subtitle: "Oblique triangles",
      emoji: "🔺", accent: "#d97706", accent2: "#f2b976",
      sections: [
        {
          title: "Law of Sines",
          questions: [
            { type: "regular", q: "State the law of sines.", answer: "\\(\\dfrac{\\sin A}{a} = \\dfrac{\\sin B}{b} = \\dfrac{\\sin C}{c}\\).", solution: "Standard form." },
            { type: "regular", q: "In triangle ABC, \\(A = 30°\\), \\(B = 45°\\), \\(a = 10\\). Find \\(b\\).", answer: "\\(b = 10\\sqrt{2} \\approx 14.14\\).", solution: "\\(\\dfrac{b}{\\sin 45} = \\dfrac{10}{\\sin 30}\\)." },
            { type: "regular", q: "When is the Law of Sines useful?", answer: "When you know AAS, ASA, or SSA.", solution: "An angle and its opposite side must be known." },
            { type: "regular", q: "Sum of angles in any triangle?", answer: "\\(180°\\).", solution: "Triangle angle sum." },
            { type: "word", q: "A triangle has angles \\(40°\\) and \\(60°\\), opposite side to \\(40°\\) is 8. Find side opposite to \\(60°\\).", answer: "\\(\\approx 10.78\\).", solution: "\\(\\dfrac{8}{\\sin 40} = \\dfrac{b}{\\sin 60}\\)." }
          ]
        },
        {
          title: "Law of Cosines",
          questions: [
            { type: "regular", q: "State the law of cosines.", answer: "\\(c^2 = a^2 + b^2 - 2ab\\cos C\\).", solution: "Standard form." },
            { type: "regular", q: "In SSS, is the Law of Cosines needed?", answer: "Yes (or Law of Sines after finding one angle).", solution: "All sides known, need angles." },
            { type: "regular", q: "Triangle with \\(a = 5, b = 7, C = 60°\\). Find \\(c\\).", answer: "\\(c = \\sqrt{39}\\).", solution: "\\(c^2 = 25 + 49 - 70\\cos 60 = 39\\)." },
            { type: "regular", q: "If \\(C = 90°\\), Law of Cosines reduces to?", answer: "Pythagorean theorem.", solution: "\\(\\cos 90 = 0\\)." },
            { type: "word", q: "Triangle sides 4, 5, 6. Find the angle opposite the side of length 6.", answer: "\\(\\approx 82.8°\\).", solution: "\\(\\cos\\theta = \\dfrac{16 + 25 - 36}{40} = 0.125\\)." }
          ]
        },
        {
          title: "Area and Applications",
          questions: [
            { type: "regular", q: "Area of a triangle with two sides \\(a, b\\) and included angle \\(C\\)?", answer: "\\(\\tfrac{1}{2}ab\\sin C\\).", solution: "Trig area formula." },
            { type: "regular", q: "Triangle with \\(a = 8, b = 10, C = 30°\\). Area?", answer: "20.", solution: "\\(\\tfrac{1}{2}(8)(10)\\sin 30\\)." },
            { type: "regular", q: "Heron's formula with \\(s = \\tfrac{a+b+c}{2}\\)?", answer: "\\(\\sqrt{s(s-a)(s-b)(s-c)}\\).", solution: "Alternative area formula." },
            { type: "regular", q: "Ambiguous case arises when which three pieces are given?", answer: "SSA.", solution: "Two sides and a non-included angle." },
            { type: "word", q: "Triangle with sides 7, 8, 9. Find area using Heron's.", answer: "\\(\\approx 26.83\\).", solution: "\\(s = 12\\); \\(\\sqrt{12 \\cdot 5 \\cdot 4 \\cdot 3} = \\sqrt{720}\\)." }
          ]
        }
      ],
      cumulativeTest: {
        title: "Cumulative Test — Law of Sines & Cosines",
        questions: [
          { type: "regular", q: "Law of Sines form?", answer: "\\(\\dfrac{\\sin A}{a} = \\dfrac{\\sin B}{b}\\).", solution: "Standard." },
          { type: "regular", q: "Triangle \\(a = 6, b = 8, C = 90°\\). Find \\(c\\).", answer: "10.", solution: "Pythagorean." },
          { type: "regular", q: "Area of triangle with \\(a = 5, b = 6, C = 30°\\)?", answer: "7.5.", solution: "\\(\\tfrac{1}{2}(5)(6)(0.5)\\)." },
          { type: "regular", q: "For SSS, best tool?", answer: "Law of Cosines.", solution: "To find any angle." },
          { type: "word", q: "Ship travels 20 mi NE then 15 mi with a bearing change of \\(40°\\). Approximate distance from start?", answer: "\\(\\approx 32.4\\) mi.", solution: "Law of Cosines application." },
          { type: "word", q: "Triangle ABC has \\(A = 45°, B = 60°, c = 12\\). Find side \\(a\\).", answer: "\\(\\approx 8.79\\).", solution: "Compute \\(C = 75°\\), apply Law of Sines." }
        ]
      }
    },
    {
      id: "pc6", num: 6, title: "Vectors", subtitle: "Magnitude, direction, operations",
      emoji: "➡️", accent: "#0891b2", accent2: "#67d2e2",
      sections: [
        {
          title: "Vector Basics",
          questions: [
            { type: "regular", q: "Magnitude of \\(\\langle 3, 4 \\rangle\\)?", answer: "5.", solution: "\\(\\sqrt{9+16}\\)." },
            { type: "regular", q: "\\(\\langle 1, 2 \\rangle + \\langle 3, -1 \\rangle\\)?", answer: "\\(\\langle 4, 1 \\rangle\\).", solution: "Add components." },
            { type: "regular", q: "Scalar multiply: \\(3\\langle 2, -1 \\rangle\\)?", answer: "\\(\\langle 6, -3 \\rangle\\).", solution: "Multiply each component." },
            { type: "regular", q: "Unit vector in direction of \\(\\langle 6, 8 \\rangle\\)?", answer: "\\(\\langle 3/5, 4/5 \\rangle\\).", solution: "Divide by magnitude 10." },
            { type: "word", q: "A force has magnitude 10 at \\(60°\\) above horizontal. Components?", answer: "\\(\\langle 5, 5\\sqrt{3} \\rangle\\).", solution: "\\(\\langle 10\\cos 60, 10\\sin 60 \\rangle\\)." }
          ]
        },
        {
          title: "Dot Product",
          questions: [
            { type: "regular", q: "\\(\\langle 2, 3 \\rangle \\cdot \\langle 4, -1 \\rangle\\)?", answer: "5.", solution: "\\(8 - 3\\)." },
            { type: "regular", q: "Formula involving angle: \\(\\mathbf{u} \\cdot \\mathbf{v}\\)?", answer: "\\(|\\mathbf{u}||\\mathbf{v}|\\cos\\theta\\).", solution: "Geometric form." },
            { type: "regular", q: "When are two non-zero vectors perpendicular?", answer: "When their dot product is 0.", solution: "\\(\\cos 90 = 0\\)." },
            { type: "regular", q: "Is \\(\\langle 1, 2 \\rangle\\) perpendicular to \\(\\langle 4, -2 \\rangle\\)?", answer: "Yes.", solution: "Dot product = \\(4 - 4 = 0\\)." },
            { type: "word", q: "Angle between \\(\\langle 1, 0 \\rangle\\) and \\(\\langle 1, 1 \\rangle\\)?", answer: "\\(45°\\).", solution: "\\(\\cos\\theta = 1/\\sqrt{2}\\)." }
          ]
        },
        {
          title: "Applications",
          questions: [
            { type: "regular", q: "A plane flies at \\(\\langle 200, 50 \\rangle\\) mph. Ground speed?", answer: "\\(\\approx 206.16\\) mph.", solution: "\\(\\sqrt{40000 + 2500}\\)." },
            { type: "regular", q: "Two forces \\(\\langle 3, 0 \\rangle\\) and \\(\\langle 0, 4 \\rangle\\) act on an object. Resultant magnitude?", answer: "5.", solution: "Sum and find magnitude." },
            { type: "regular", q: "Direction (angle) of \\(\\langle 1, 1 \\rangle\\)?", answer: "\\(45°\\).", solution: "\\(\\tan^{-1}(1/1)\\)." },
            { type: "regular", q: "Component form of a vector with magnitude 10 at \\(30°\\)?", answer: "\\(\\langle 5\\sqrt{3}, 5 \\rangle\\).", solution: "\\(\\langle 10\\cos 30, 10\\sin 30 \\rangle\\)." },
            { type: "word", q: "Boat aims north at 8 mph; current pushes east at 6 mph. Actual speed and direction?", answer: "10 mph, at \\(\\tan^{-1}(6/8) \\approx 36.87°\\) east of north.", solution: "Vector sum: magnitude \\(\\sqrt{64+36} = 10\\)." }
          ]
        }
      ],
      cumulativeTest: {
        title: "Cumulative Test — Vectors",
        questions: [
          { type: "regular", q: "Magnitude of \\(\\langle -6, 8 \\rangle\\)?", answer: "10.", solution: "\\(\\sqrt{36+64}\\)." },
          { type: "regular", q: "Dot product of \\(\\langle 2, 5 \\rangle\\) and \\(\\langle -1, 3 \\rangle\\)?", answer: "13.", solution: "\\(-2 + 15\\)." },
          { type: "regular", q: "Sum \\(\\langle 3, -2 \\rangle + \\langle 1, 4 \\rangle\\)?", answer: "\\(\\langle 4, 2 \\rangle\\).", solution: "Component-wise." },
          { type: "regular", q: "Are \\(\\langle 2, 3 \\rangle\\) and \\(\\langle 3, -2 \\rangle\\) perpendicular?", answer: "Yes.", solution: "Dot product 0." },
          { type: "word", q: "Components of a vector 12 units long at \\(45°\\)?", answer: "\\(\\langle 6\\sqrt{2}, 6\\sqrt{2} \\rangle\\).", solution: "\\(12\\cos 45 = 6\\sqrt{2}\\)." },
          { type: "word", q: "Unit vector in direction \\(\\langle 0, -5 \\rangle\\)?", answer: "\\(\\langle 0, -1 \\rangle\\).", solution: "Divide by 5." }
        ]
      }
    },
    {
      id: "pc7", num: 7, title: "Polar & Parametric", subtitle: "Alternate coordinate systems",
      emoji: "🎯", accent: "#e11d48", accent2: "#f39eaf",
      sections: [
        {
          title: "Polar Coordinates",
          questions: [
            { type: "regular", q: "Convert \\((r, \\theta) = (4, \\pi/3)\\) to Cartesian.", answer: "\\((2, 2\\sqrt{3})\\).", solution: "\\(x = r\\cos\\theta, y = r\\sin\\theta\\)." },
            { type: "regular", q: "Convert \\((x, y) = (3, 3)\\) to polar (with \\(\\theta \\in [0, 2\\pi)\\)).", answer: "\\((3\\sqrt{2}, \\pi/4)\\).", solution: "\\(r = \\sqrt{18}, \\theta = \\tan^{-1}(1)\\)." },
            { type: "regular", q: "What does \\(r = 5\\) represent?", answer: "A circle of radius 5 centered at origin.", solution: "Constant \\(r\\)." },
            { type: "regular", q: "What does \\(\\theta = \\pi/4\\) represent?", answer: "A line through the origin at \\(45°\\).", solution: "Constant angle." },
            { type: "word", q: "Convert \\(r = 2\\cos\\theta\\) to Cartesian.", answer: "\\(x^2 + y^2 = 2x\\) (a circle).", solution: "Multiply by \\(r\\), use \\(r^2 = x^2 + y^2\\), \\(r\\cos\\theta = x\\)." }
          ]
        },
        {
          title: "Polar Graphs",
          questions: [
            { type: "regular", q: "Graph of \\(r = \\theta\\)?", answer: "A spiral (Archimedean).", solution: "Radius grows with angle." },
            { type: "regular", q: "What shape is \\(r = 2 + 2\\cos\\theta\\)?", answer: "Cardioid.", solution: "\\(r = a + a\\cos\\theta\\) is a cardioid." },
            { type: "regular", q: "How many petals for \\(r = \\sin(3\\theta)\\)?", answer: "3 petals.", solution: "Odd \\(n\\): \\(n\\) petals." },
            { type: "regular", q: "Is \\(r = 5\\sin\\theta\\) symmetric about the y-axis?", answer: "Yes.", solution: "\\(\\sin\\) symmetric about \\(\\theta = \\pi/2\\)." },
            { type: "word", q: "\\(r = 3\\cos(2\\theta)\\) has how many petals?", answer: "4.", solution: "Even \\(n\\): \\(2n\\) petals." }
          ]
        },
        {
          title: "Parametric Equations",
          questions: [
            { type: "regular", q: "Eliminate parameter: \\(x = t + 1, y = 2t\\).", answer: "\\(y = 2x - 2\\).", solution: "\\(t = x - 1\\); sub." },
            { type: "regular", q: "Eliminate parameter: \\(x = \\cos t, y = \\sin t\\).", answer: "\\(x^2 + y^2 = 1\\).", solution: "Pythagorean identity." },
            { type: "regular", q: "At \\(t = 0\\): \\(x = 2\\cos t, y = 2\\sin t\\). Point?", answer: "\\((2, 0)\\).", solution: "Plug \\(t = 0\\)." },
            { type: "regular", q: "\\(x = t^2, y = t\\). Curve shape?", answer: "A sideways parabola \\(x = y^2\\).", solution: "Eliminate \\(t\\)." },
            { type: "word", q: "Projectile: \\(x = 20t, y = 30t - 16t^2\\). Initial height?", answer: "0.", solution: "\\(y(0) = 0\\)." }
          ]
        }
      ],
      cumulativeTest: {
        title: "Cumulative Test — Polar & Parametric",
        questions: [
          { type: "regular", q: "Convert \\((2, \\pi/2)\\) polar to Cartesian.", answer: "\\((0, 2)\\).", solution: "Plug in." },
          { type: "regular", q: "Shape of \\(r = 4\\)?", answer: "Circle radius 4.", solution: "Constant \\(r\\)." },
          { type: "regular", q: "Eliminate \\(t\\): \\(x = 3t, y = t + 1\\).", answer: "\\(y = x/3 + 1\\).", solution: "\\(t = x/3\\)." },
          { type: "regular", q: "Petals for \\(r = \\sin(5\\theta)\\)?", answer: "5.", solution: "Odd \\(n\\)." },
          { type: "word", q: "Convert \\((x, y) = (0, 4)\\) to polar.", answer: "\\((4, \\pi/2)\\).", solution: "On positive y-axis." },
          { type: "word", q: "At \\(t = \\pi/4\\): \\(x = \\cos t, y = \\sin t\\)?", answer: "\\((\\sqrt{2}/2, \\sqrt{2}/2)\\).", solution: "Unit circle." }
        ]
      }
    },
    {
      id: "pc8", num: 8, title: "Matrices & Systems", subtitle: "Gaussian elimination, inverses",
      emoji: "🔢", accent: "#6366f1", accent2: "#a8afff",
      sections: [
        {
          title: "Matrix Basics",
          questions: [
            { type: "regular", q: "Add \\(\\begin{pmatrix}1&2\\\\3&4\\end{pmatrix} + \\begin{pmatrix}0&1\\\\1&0\\end{pmatrix}\\).", answer: "\\(\\begin{pmatrix}1&3\\\\4&4\\end{pmatrix}\\).", solution: "Add entry-wise." },
            { type: "regular", q: "What's the size of \\(\\begin{pmatrix}1&2&3\\\\4&5&6\\end{pmatrix}\\)?", answer: "\\(2 \\times 3\\).", solution: "Rows × columns." },
            { type: "regular", q: "Scalar multiply: \\(3\\begin{pmatrix}2&-1\\\\0&4\\end{pmatrix}\\)?", answer: "\\(\\begin{pmatrix}6&-3\\\\0&12\\end{pmatrix}\\).", solution: "Each entry times 3." },
            { type: "regular", q: "Is matrix addition commutative?", answer: "Yes.", solution: "Entry-wise addition is commutative." },
            { type: "word", q: "A store has two products' costs in two warehouses. Matrix addition represents what?", answer: "Combined inventory value.", solution: "Entry-wise sums." }
          ]
        },
        {
          title: "Matrix Multiplication",
          questions: [
            { type: "regular", q: "Multiply \\(\\begin{pmatrix}1&2\\\\3&4\\end{pmatrix}\\begin{pmatrix}5\\\\6\\end{pmatrix}\\).", answer: "\\(\\begin{pmatrix}17\\\\39\\end{pmatrix}\\).", solution: "Row dotted with column." },
            { type: "regular", q: "Can you multiply a \\(2\\times 3\\) by a \\(3\\times 2\\)?", answer: "Yes, result is \\(2 \\times 2\\).", solution: "Inner dimensions match." },
            { type: "regular", q: "Is matrix multiplication commutative?", answer: "No.", solution: "Generally \\(AB \\ne BA\\)." },
            { type: "regular", q: "Determinant of \\(\\begin{pmatrix}2&3\\\\1&4\\end{pmatrix}\\)?", answer: "5.", solution: "\\(2 \\cdot 4 - 3 \\cdot 1\\)." },
            { type: "word", q: "What is the identity matrix, and what does it do?", answer: "Square matrix with 1s on diagonal and 0s elsewhere; \\(AI = IA = A\\).", solution: "Identity element for multiplication." }
          ]
        },
        {
          title: "Solving Systems with Matrices",
          questions: [
            { type: "regular", q: "Write the system \\(x + y = 3, 2x - y = 0\\) as a matrix equation.", answer: "\\(\\begin{pmatrix}1&1\\\\2&-1\\end{pmatrix}\\begin{pmatrix}x\\\\y\\end{pmatrix} = \\begin{pmatrix}3\\\\0\\end{pmatrix}\\).", solution: "Coefficients and RHS." },
            { type: "regular", q: "If \\(\\det A = 0\\), can you find \\(A^{-1}\\)?", answer: "No.", solution: "Singular matrix." },
            { type: "regular", q: "Inverse of \\(\\begin{pmatrix}1&0\\\\0&2\\end{pmatrix}\\)?", answer: "\\(\\begin{pmatrix}1&0\\\\0&1/2\\end{pmatrix}\\).", solution: "Invert diagonal." },
            { type: "regular", q: "What does row reduction to RREF help solve?", answer: "Systems of linear equations.", solution: "Gaussian elimination." },
            { type: "word", q: "Solve \\(x + y = 5, x - y = 1\\) any way.", answer: "\\(x = 3, y = 2\\).", solution: "Add equations, divide." }
          ]
        }
      ],
      cumulativeTest: {
        title: "Cumulative Test — Matrices & Systems",
        questions: [
          { type: "regular", q: "Size of \\(\\begin{pmatrix}1\\\\2\\\\3\\end{pmatrix}\\)?", answer: "\\(3 \\times 1\\).", solution: "Rows × cols." },
          { type: "regular", q: "Det \\(\\begin{pmatrix}3&2\\\\1&4\\end{pmatrix}\\)?", answer: "10.", solution: "\\(12 - 2\\)." },
          { type: "regular", q: "Is \\(AB = BA\\) generally?", answer: "No.", solution: "Not commutative." },
          { type: "regular", q: "Identity matrix (\\(2 \\times 2\\))?", answer: "\\(\\begin{pmatrix}1&0\\\\0&1\\end{pmatrix}\\).", solution: "Identity." },
          { type: "word", q: "Solve \\(2x + y = 7, x - y = 2\\).", answer: "\\(x = 3, y = 1\\).", solution: "Add: \\(3x = 9\\)." },
          { type: "word", q: "Add \\(\\begin{pmatrix}1&0\\\\0&1\\end{pmatrix} + \\begin{pmatrix}2&3\\\\4&5\\end{pmatrix}\\).", answer: "\\(\\begin{pmatrix}3&3\\\\4&6\\end{pmatrix}\\).", solution: "Entry-wise." }
        ]
      }
    },
    {
      id: "pc9", num: 9, title: "Intro to Limits", subtitle: "A bridge to calculus",
      emoji: "🌅", accent: "#7c2d12", accent2: "#c08a6e",
      sections: [
        {
          title: "Evaluating Limits",
          questions: [
            { type: "regular", q: "\\(\\lim_{x \\to 2}(3x + 1)\\)?", answer: "7.", solution: "Direct substitution works for polynomials." },
            { type: "regular", q: "\\(\\lim_{x \\to 0} \\dfrac{\\sin x}{x}\\)?", answer: "1.", solution: "Fundamental trig limit." },
            { type: "regular", q: "\\(\\lim_{x \\to \\infty} \\dfrac{1}{x}\\)?", answer: "0.", solution: "Reciprocal of large = small." },
            { type: "regular", q: "\\(\\lim_{x \\to 3} x^2 - 9\\)?", answer: "0.", solution: "Substitute." },
            { type: "word", q: "Evaluate \\(\\lim_{x \\to 1} \\dfrac{x^2 - 1}{x - 1}\\).", answer: "2.", solution: "Factor: \\((x+1)(x-1)/(x-1) = x + 1\\); limit is 2." }
          ]
        },
        {
          title: "One-Sided Limits & Continuity",
          questions: [
            { type: "regular", q: "For \\(f(x) = 1/x\\), \\(\\lim_{x \\to 0^+} f(x)\\)?", answer: "\\(+\\infty\\).", solution: "From the right." },
            { type: "regular", q: "Is \\(f(x) = |x|\\) continuous at \\(x = 0\\)?", answer: "Yes.", solution: "Defined, limit exists, equal." },
            { type: "regular", q: "Three conditions for continuity at \\(x = a\\)?", answer: "\\(f(a)\\) defined, \\(\\lim_{x\\to a}f(x)\\) exists, and they agree.", solution: "Standard definition." },
            { type: "regular", q: "Does \\(\\lim_{x \\to 0} \\dfrac{|x|}{x}\\) exist?", answer: "No.", solution: "Left-limit \\(-1\\), right-limit \\(1\\)." },
            { type: "word", q: "A piecewise function is \\(x^2\\) for \\(x < 1\\) and \\(2x\\) for \\(x \\geq 1\\). Continuous at \\(x = 1\\)?", answer: "No — left-limit is 1, right is 2.", solution: "Limits differ." }
          ]
        },
        {
          title: "Intro to Derivatives",
          questions: [
            { type: "regular", q: "Definition of the derivative?", answer: "\\(f'(x) = \\lim_{h \\to 0} \\dfrac{f(x+h) - f(x)}{h}\\).", solution: "Limit of difference quotient." },
            { type: "regular", q: "What does \\(f'(x)\\) represent geometrically?", answer: "Slope of the tangent line to \\(f\\) at \\(x\\).", solution: "Instantaneous rate of change." },
            { type: "regular", q: "Find \\(f'(x)\\) if \\(f(x) = x^2\\).", answer: "\\(2x\\).", solution: "Power rule or limit definition." },
            { type: "regular", q: "Derivative of a constant?", answer: "0.", solution: "Flat line has zero slope." },
            { type: "word", q: "Average rate of change of \\(f(x) = x^2\\) on \\([1, 3]\\)?", answer: "4.", solution: "\\((9 - 1)/(3 - 1)\\)." }
          ]
        }
      ],
      cumulativeTest: {
        title: "Cumulative Test — Intro to Limits",
        questions: [
          { type: "regular", q: "\\(\\lim_{x \\to 4}(x^2 - 1)\\)?", answer: "15.", solution: "Substitute." },
          { type: "regular", q: "\\(\\lim_{x \\to 0}\\dfrac{\\sin x}{x}\\)?", answer: "1.", solution: "Classic." },
          { type: "regular", q: "\\(\\lim_{x \\to \\infty}\\dfrac{5}{x^2}\\)?", answer: "0.", solution: "Denom grows without bound." },
          { type: "regular", q: "\\(f'(x)\\) for \\(f(x) = 3x\\)?", answer: "3.", solution: "Slope of a line." },
          { type: "word", q: "\\(\\lim_{x \\to 2}\\dfrac{x^2 - 4}{x - 2}\\)?", answer: "4.", solution: "Factor and cancel: \\(x + 2\\) at \\(x = 2\\)." },
          { type: "word", q: "Avg rate of change of \\(f(x) = x^3\\) on \\([0, 2]\\)?", answer: "4.", solution: "\\((8 - 0)/2\\)." }
        ]
      }
    }
  ]
};
