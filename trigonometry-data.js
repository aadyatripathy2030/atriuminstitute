// Trigonometry course — angles, ratios, identities, applications.
const TRIGONOMETRY_COURSE = {
  id: "trigonometry",
  title: "Trigonometry",
  subtitle: "Angles, ratios, identities, triangle laws",
  emoji: "📐",
  accent: "#6a82fb",
  accent2: "#fc5c7d",
  description: "Five chapters from angle measure and the unit circle through identities, equations, and the laws of sines and cosines.",
  books: [
    {
      id: "tr1", num: 1, title: "Angles & Radian Measure", subtitle: "Degrees, radians, arc length",
      emoji: "📏", accent: "#6a82fb", accent2: "#fc5c7d",
      sections: [
        {
          title: "Degrees & Radians",
          questions: [
            { type: "regular", q: "Convert \\(180°\\) to radians.", answer: "\\(\\pi\\).", solution: "\\(180° = \\pi\\) rad." },
            { type: "regular", q: "Convert \\(\\dfrac{\\pi}{6}\\) to degrees.", answer: "\\(30°\\).", solution: "\\(\\pi\\) rad = \\(180°\\), so \\(\\pi/6 = 30°\\)." },
            { type: "regular", q: "Convert \\(90°\\) to radians.", answer: "\\(\\dfrac{\\pi}{2}\\).", solution: "\\(90 \\cdot \\pi/180\\)." },
            { type: "regular", q: "Convert \\(\\dfrac{3\\pi}{4}\\) to degrees.", answer: "\\(135°\\).", solution: "\\((3/4)(180)\\)." },
            { type: "word", q: "A wheel turns through \\(2\\pi\\) radians. How many degrees?", answer: "\\(360°\\).", solution: "Full rotation." }
          ]
        },
        {
          title: "Coterminal & Reference Angles",
          questions: [
            { type: "regular", q: "Find a positive coterminal angle to \\(-30°\\).", answer: "\\(330°\\).", solution: "Add \\(360°\\)." },
            { type: "regular", q: "Reference angle for \\(135°\\)?", answer: "\\(45°\\).", solution: "\\(180 - 135\\)." },
            { type: "regular", q: "Reference angle for \\(210°\\)?", answer: "\\(30°\\).", solution: "\\(210 - 180\\)." },
            { type: "regular", q: "Coterminal angle to \\(400°\\)?", answer: "\\(40°\\).", solution: "Subtract \\(360°\\)." },
            { type: "word", q: "Reference angle for \\(\\dfrac{5\\pi}{4}\\)?", answer: "\\(\\dfrac{\\pi}{4}\\).", solution: "\\(5\\pi/4 - \\pi\\)." }
          ]
        },
        {
          title: "Arc Length & Sector Area",
          questions: [
            { type: "regular", q: "Arc length: radius 4, angle \\(\\dfrac{\\pi}{2}\\)?", answer: "\\(2\\pi\\).", solution: "\\(s = r\\theta\\)." },
            { type: "regular", q: "Sector area: radius 6, angle \\(\\dfrac{\\pi}{3}\\)?", answer: "\\(6\\pi\\).", solution: "\\(A = \\tfrac{1}{2}r^2\\theta\\)." },
            { type: "regular", q: "Arc length: radius 10, angle 1 rad?", answer: "10.", solution: "\\(s = r\\theta\\)." },
            { type: "regular", q: "Angle (in radians) if arc length 15 and radius 5?", answer: "3 rad.", solution: "\\(\\theta = s/r\\)." },
            { type: "word", q: "A bike wheel of radius 12 in turns through \\(60°\\). Arc length?", answer: "\\(4\\pi\\) in.", solution: "\\(\\theta = \\pi/3\\); \\(s = 12 \\cdot \\pi/3\\)." }
          ]
        }
      ],
      cumulativeTest: {
        title: "Cumulative Test — Angles & Radian Measure",
        questions: [
          { type: "regular", q: "Convert \\(60°\\) to radians.", answer: "\\(\\dfrac{\\pi}{3}\\).", solution: "\\(60 \\cdot \\pi/180\\)." },
          { type: "regular", q: "Reference angle of \\(300°\\)?", answer: "\\(60°\\).", solution: "\\(360 - 300\\)." },
          { type: "regular", q: "Arc length: radius 8, angle \\(\\pi/4\\)?", answer: "\\(2\\pi\\).", solution: "\\(s = r\\theta\\)." },
          { type: "regular", q: "Coterminal angle to \\(-90°\\)?", answer: "\\(270°\\).", solution: "Add \\(360\\)." },
          { type: "word", q: "Convert \\(\\dfrac{7\\pi}{6}\\) to degrees.", answer: "\\(210°\\).", solution: "\\((7/6)(180)\\)." },
          { type: "word", q: "A clock's minute hand has length 6 in. Distance the tip moves in 15 min?", answer: "\\(3\\pi\\) in.", solution: "Quarter circle: \\(\\theta = \\pi/2\\); \\(s = 6 \\cdot \\pi/2\\)." }
        ]
      }
    },
    {
      id: "tr2", num: 2, title: "Right Triangle Trigonometry", subtitle: "SOH-CAH-TOA, special triangles",
      emoji: "📐", accent: "#fc5c7d", accent2: "#feca57",
      sections: [
        {
          title: "Trig Ratios (SOH-CAH-TOA)",
          questions: [
            { type: "regular", q: "In a right triangle, opposite = 3, hypotenuse = 5. Find \\(\\sin\\theta\\).", answer: "\\(\\dfrac{3}{5}\\).", solution: "Opp/hyp." },
            { type: "regular", q: "Find \\(\\cos\\theta\\) if adjacent = 8, hypotenuse = 10.", answer: "\\(\\dfrac{4}{5}\\).", solution: "Adj/hyp." },
            { type: "regular", q: "Find \\(\\tan\\theta\\) if opposite = 7, adjacent = 24.", answer: "\\(\\dfrac{7}{24}\\).", solution: "Opp/adj." },
            { type: "regular", q: "If \\(\\sin\\theta = \\tfrac{5}{13}\\) (QI), find \\(\\cos\\theta\\).", answer: "\\(\\dfrac{12}{13}\\).", solution: "Pythagoras: \\(\\cos^2 = 1 - 25/169\\)." },
            { type: "word", q: "A ramp rises 4 ft over a 5-ft hypotenuse. \\(\\sin\\) of incline angle?", answer: "\\(\\dfrac{4}{5}\\).", solution: "Opp/hyp." }
          ]
        },
        {
          title: "Special Right Triangles",
          questions: [
            { type: "regular", q: "\\(\\sin 45°\\)?", answer: "\\(\\dfrac{\\sqrt{2}}{2}\\).", solution: "From 45-45-90." },
            { type: "regular", q: "\\(\\cos 60°\\)?", answer: "\\(\\dfrac{1}{2}\\).", solution: "From 30-60-90." },
            { type: "regular", q: "\\(\\tan 30°\\)?", answer: "\\(\\dfrac{\\sqrt{3}}{3}\\).", solution: "\\(\\tfrac{1/2}{\\sqrt{3}/2}\\)." },
            { type: "regular", q: "Diagonal of a square with side 5?", answer: "\\(5\\sqrt{2}\\).", solution: "Side × \\(\\sqrt{2}\\)." },
            { type: "word", q: "30-60-90 with short leg 4. Long leg?", answer: "\\(4\\sqrt{3}\\).", solution: "Short \\(\\cdot \\sqrt{3}\\)." }
          ]
        },
        {
          title: "Applications: Heights & Distances",
          questions: [
            { type: "regular", q: "Angle of elevation \\(30°\\); horizontal distance 100 ft. Height?", answer: "\\(\\approx 57.7\\) ft.", solution: "\\(100 \\tan 30°\\)." },
            { type: "regular", q: "Ladder 10 ft long, base 6 ft from wall. Height reached?", answer: "8 ft.", solution: "\\(\\sqrt{100-36}\\)." },
            { type: "regular", q: "From 50 ft away, angle of elevation to top is \\(45°\\). Height?", answer: "50 ft.", solution: "\\(\\tan 45° = 1\\)." },
            { type: "regular", q: "A 12-ft pole casts a 16-ft shadow. \\(\\tan\\) of sun's elevation?", answer: "\\(\\tfrac{12}{16} = \\tfrac{3}{4}\\).", solution: "Opp/adj." },
            { type: "word", q: "From 80 ft away, angle of elevation \\(60°\\). Height of tower?", answer: "\\(80\\sqrt{3} \\approx 138.6\\) ft.", solution: "\\(80 \\tan 60°\\)." }
          ]
        }
      ],
      cumulativeTest: {
        title: "Cumulative Test — Right Triangle Trig",
        questions: [
          { type: "regular", q: "\\(\\sin\\theta\\) if opp = 8, hyp = 17?", answer: "\\(\\tfrac{8}{17}\\).", solution: "Opp/hyp." },
          { type: "regular", q: "\\(\\cos 30°\\)?", answer: "\\(\\dfrac{\\sqrt{3}}{2}\\).", solution: "Special triangle." },
          { type: "regular", q: "\\(\\tan 45°\\)?", answer: "1.", solution: "Opp = adj in 45-45-90." },
          { type: "regular", q: "Hypotenuse of a 3-4-5 triangle?", answer: "5.", solution: "Pythagorean triple." },
          { type: "word", q: "From 30 ft away, angle of elevation \\(45°\\). Height?", answer: "30 ft.", solution: "\\(\\tan 45° = 1\\)." },
          { type: "word", q: "30-60-90 with long leg \\(5\\sqrt{3}\\). Hypotenuse?", answer: "10.", solution: "Long leg / \\(\\sqrt{3}\\) × 2." }
        ]
      }
    },
    {
      id: "tr3", num: 3, title: "Unit Circle & Trig Functions", subtitle: "Beyond right triangles",
      emoji: "🎯", accent: "#48dbfb", accent2: "#0abde3",
      sections: [
        {
          title: "Unit Circle Values",
          questions: [
            { type: "regular", q: "\\(\\sin\\dfrac{\\pi}{2}\\)?", answer: "1.", solution: "Top of unit circle." },
            { type: "regular", q: "\\(\\cos\\pi\\)?", answer: "\\(-1\\).", solution: "Left side." },
            { type: "regular", q: "\\(\\sin\\dfrac{2\\pi}{3}\\)?", answer: "\\(\\dfrac{\\sqrt{3}}{2}\\).", solution: "Reference \\(\\pi/3\\), QII." },
            { type: "regular", q: "\\(\\cos\\dfrac{5\\pi}{4}\\)?", answer: "\\(-\\dfrac{\\sqrt{2}}{2}\\).", solution: "Reference \\(\\pi/4\\), QIII." },
            { type: "word", q: "Where is \\(\\sin\\theta = 0\\)?", answer: "\\(\\theta = 0, \\pi, 2\\pi, \\ldots\\).", solution: "y-coordinate zero." }
          ]
        },
        {
          title: "Sine, Cosine, Tangent of Any Angle",
          questions: [
            { type: "regular", q: "\\(\\sin 150°\\)?", answer: "\\(\\dfrac{1}{2}\\).", solution: "Reference \\(30°\\), QII positive." },
            { type: "regular", q: "\\(\\cos 240°\\)?", answer: "\\(-\\dfrac{1}{2}\\).", solution: "Reference \\(60°\\), QIII negative." },
            { type: "regular", q: "\\(\\tan 180°\\)?", answer: "0.", solution: "\\(\\sin 180 = 0\\)." },
            { type: "regular", q: "If \\(\\sin\\theta = -\\tfrac{1}{2}\\) in QIII, \\(\\cos\\theta\\)?", answer: "\\(-\\dfrac{\\sqrt{3}}{2}\\).", solution: "Pythagorean + QIII." },
            { type: "word", q: "\\(\\tan 135°\\)?", answer: "\\(-1\\).", solution: "Reference \\(45°\\), QII negative." }
          ]
        },
        {
          title: "Reciprocal Functions (csc, sec, cot)",
          questions: [
            { type: "regular", q: "\\(\\csc 30°\\)?", answer: "2.", solution: "\\(1/\\sin 30°\\)." },
            { type: "regular", q: "\\(\\sec 60°\\)?", answer: "2.", solution: "\\(1/\\cos 60°\\)." },
            { type: "regular", q: "\\(\\cot 45°\\)?", answer: "1.", solution: "\\(1/\\tan 45°\\)." },
            { type: "regular", q: "If \\(\\sin\\theta = \\tfrac{3}{5}\\), \\(\\csc\\theta\\)?", answer: "\\(\\dfrac{5}{3}\\).", solution: "Reciprocal." },
            { type: "word", q: "\\(\\sec 90°\\)?", answer: "Undefined.", solution: "\\(\\cos 90 = 0\\)." }
          ]
        }
      ],
      cumulativeTest: {
        title: "Cumulative Test — Unit Circle",
        questions: [
          { type: "regular", q: "\\(\\sin 0\\)?", answer: "0.", solution: "Right side of circle." },
          { type: "regular", q: "\\(\\cos\\dfrac{\\pi}{2}\\)?", answer: "0.", solution: "Top." },
          { type: "regular", q: "\\(\\tan\\dfrac{\\pi}{4}\\)?", answer: "1.", solution: "Special angle." },
          { type: "regular", q: "\\(\\sin 270°\\)?", answer: "\\(-1\\).", solution: "Bottom." },
          { type: "word", q: "\\(\\csc 90°\\)?", answer: "1.", solution: "\\(1/\\sin 90°\\)." },
          { type: "word", q: "\\(\\cot\\dfrac{\\pi}{3}\\)?", answer: "\\(\\dfrac{\\sqrt{3}}{3}\\).", solution: "\\(1/\\tan 60°\\)." }
        ]
      }
    },
    {
      id: "tr4", num: 4, title: "Trig Identities", subtitle: "Pythagorean, sum/difference, double angle",
      emoji: "🔁", accent: "#1dd1a1", accent2: "#10ac84",
      sections: [
        {
          title: "Pythagorean & Reciprocal Identities",
          questions: [
            { type: "regular", q: "Simplify \\(1 - \\sin^2\\theta\\).", answer: "\\(\\cos^2\\theta\\).", solution: "Pythagorean." },
            { type: "regular", q: "Simplify \\(\\sec^2\\theta - 1\\).", answer: "\\(\\tan^2\\theta\\).", solution: "Pythagorean." },
            { type: "regular", q: "Simplify \\(\\tan\\theta\\cos\\theta\\).", answer: "\\(\\sin\\theta\\).", solution: "\\(\\sin/\\cos \\cdot \\cos\\)." },
            { type: "regular", q: "If \\(\\sin\\theta = \\tfrac{3}{5}\\) (QI), \\(\\cos\\theta\\)?", answer: "\\(\\dfrac{4}{5}\\).", solution: "Pythagorean." },
            { type: "word", q: "Verify \\(\\sin\\theta\\csc\\theta = 1\\).", answer: "True.", solution: "Reciprocals." }
          ]
        },
        {
          title: "Sum & Difference Formulas",
          questions: [
            { type: "regular", q: "\\(\\sin(A+B) = ?\\)", answer: "\\(\\sin A\\cos B + \\cos A\\sin B\\).", solution: "Standard sum formula." },
            { type: "regular", q: "\\(\\cos(A-B) = ?\\)", answer: "\\(\\cos A\\cos B + \\sin A\\sin B\\).", solution: "Difference formula." },
            { type: "regular", q: "\\(\\sin 75°\\) using \\(45 + 30\\)?", answer: "\\(\\dfrac{\\sqrt{6}+\\sqrt{2}}{4}\\).", solution: "Apply sum formula." },
            { type: "regular", q: "\\(\\cos 15°\\) using \\(45 - 30\\)?", answer: "\\(\\dfrac{\\sqrt{6}+\\sqrt{2}}{4}\\).", solution: "Apply difference formula." },
            { type: "word", q: "Verify \\(\\sin(\\theta + 2\\pi) = \\sin\\theta\\).", answer: "True.", solution: "Periodicity." }
          ]
        },
        {
          title: "Double & Half Angle Formulas",
          questions: [
            { type: "regular", q: "\\(\\sin 2\\theta = ?\\)", answer: "\\(2\\sin\\theta\\cos\\theta\\).", solution: "Double angle." },
            { type: "regular", q: "\\(\\cos 2\\theta\\) (one form)?", answer: "\\(\\cos^2\\theta - \\sin^2\\theta\\).", solution: "Or \\(1 - 2\\sin^2\\) or \\(2\\cos^2 - 1\\)." },
            { type: "regular", q: "If \\(\\sin\\theta = \\tfrac{3}{5}\\) (QI), \\(\\sin 2\\theta\\)?", answer: "\\(\\dfrac{24}{25}\\).", solution: "\\(2 \\cdot \\tfrac{3}{5} \\cdot \\tfrac{4}{5}\\)." },
            { type: "regular", q: "Half-angle: \\(\\sin\\dfrac{\\theta}{2}\\)?", answer: "\\(\\pm\\sqrt{\\tfrac{1-\\cos\\theta}{2}}\\).", solution: "Half-angle formula." },
            { type: "word", q: "If \\(\\cos\\theta = \\tfrac{1}{2}\\), \\(\\cos 2\\theta\\)?", answer: "\\(-\\dfrac{1}{2}\\).", solution: "\\(2(1/4) - 1\\)." }
          ]
        }
      ],
      cumulativeTest: {
        title: "Cumulative Test — Trig Identities",
        questions: [
          { type: "regular", q: "Simplify \\(\\sin^2 + \\cos^2\\).", answer: "1.", solution: "Pythagorean." },
          { type: "regular", q: "\\(\\sin(A+B)\\)?", answer: "\\(\\sin A\\cos B + \\cos A\\sin B\\).", solution: "Standard." },
          { type: "regular", q: "\\(\\sin 2\\theta\\)?", answer: "\\(2\\sin\\theta\\cos\\theta\\).", solution: "Double angle." },
          { type: "regular", q: "If \\(\\sin\\theta = \\tfrac{4}{5}\\) (QI), \\(\\cos\\theta\\)?", answer: "\\(\\tfrac{3}{5}\\).", solution: "Pythagorean." },
          { type: "word", q: "Simplify \\(2\\sin 30°\\cos 30°\\).", answer: "\\(\\dfrac{\\sqrt{3}}{2}\\).", solution: "\\(= \\sin 60°\\)." },
          { type: "word", q: "Verify \\(\\tan\\theta\\cot\\theta = 1\\).", answer: "True.", solution: "Reciprocals." }
        ]
      }
    },
    {
      id: "tr5", num: 5, title: "Law of Sines and Cosines", subtitle: "Solving any triangle",
      emoji: "🔺", accent: "#5f27cd", accent2: "#48dbfb",
      sections: [
        {
          title: "Law of Sines",
          questions: [
            { type: "regular", q: "Triangle ABC: \\(A=30°, B=60°, a=5\\). Find \\(b\\).", answer: "\\(5\\sqrt{3}\\).", solution: "\\(\\tfrac{5}{\\sin 30} = \\tfrac{b}{\\sin 60}\\)." },
            { type: "regular", q: "Law of Sines formula?", answer: "\\(\\dfrac{a}{\\sin A} = \\dfrac{b}{\\sin B} = \\dfrac{c}{\\sin C}\\).", solution: "Standard form." },
            { type: "regular", q: "If \\(A=45°, B=60°, a=10\\), find \\(b\\).", answer: "\\(\\approx 12.25\\).", solution: "\\(\\tfrac{10}{\\sin 45} = \\tfrac{b}{\\sin 60}\\)." },
            { type: "regular", q: "Triangle: \\(C=90°, c=10, A=30°\\). Find \\(a\\).", answer: "5.", solution: "\\(\\sin 30 = a/10\\)." },
            { type: "word", q: "Two angles \\(40°\\) and \\(60°\\) with side opposite \\(40°\\) being 8. Find side opposite \\(60°\\).", answer: "\\(\\approx 10.78\\).", solution: "\\(\\tfrac{8}{\\sin 40} = \\tfrac{x}{\\sin 60}\\)." }
          ]
        },
        {
          title: "Law of Cosines",
          questions: [
            { type: "regular", q: "Law of Cosines formula?", answer: "\\(c^2 = a^2 + b^2 - 2ab\\cos C\\).", solution: "Generalizes Pythagoras." },
            { type: "regular", q: "If \\(a=5, b=7, C=60°\\), find \\(c\\).", answer: "\\(\\sqrt{39}\\).", solution: "\\(c^2 = 25 + 49 - 35\\)." },
            { type: "regular", q: "If \\(a=3, b=4, c=5\\), find \\(\\cos C\\).", answer: "0.", solution: "\\(\\cos C = (a^2+b^2-c^2)/2ab = 0\\), right triangle." },
            { type: "regular", q: "If \\(a=6, b=8, c=10\\), is it right-angled?", answer: "Yes.", solution: "\\(6^2+8^2=10^2\\)." },
            { type: "word", q: "Sides 7, 9, included angle \\(45°\\). Third side?", answer: "\\(\\approx 6.39\\).", solution: "\\(c^2 = 49+81-126\\cos 45\\)." }
          ]
        },
        {
          title: "Area of Triangles",
          questions: [
            { type: "regular", q: "Area: \\(a=5, b=8, C=30°\\).", answer: "10.", solution: "\\(\\tfrac{1}{2}ab\\sin C\\)." },
            { type: "regular", q: "Heron's formula needs?", answer: "All three sides.", solution: "\\(A = \\sqrt{s(s-a)(s-b)(s-c)}\\)." },
            { type: "regular", q: "Area: sides 3, 4, included angle \\(90°\\)?", answer: "6.", solution: "\\(\\tfrac{1}{2}(3)(4)\\)." },
            { type: "regular", q: "Area with sides 6, 8, included angle \\(60°\\)?", answer: "\\(12\\sqrt{3}\\).", solution: "\\(\\tfrac{1}{2}(6)(8)\\sin 60\\)." },
            { type: "word", q: "Triangle with all sides 6. Area?", answer: "\\(9\\sqrt{3}\\).", solution: "Equilateral: \\(\\tfrac{\\sqrt{3}}{4}s^2\\)." }
          ]
        }
      ],
      cumulativeTest: {
        title: "Cumulative Test — Triangle Laws",
        questions: [
          { type: "regular", q: "Law of Sines formula?", answer: "\\(\\dfrac{a}{\\sin A} = \\dfrac{b}{\\sin B}\\).", solution: "Standard." },
          { type: "regular", q: "Law of Cosines: \\(c^2\\)?", answer: "\\(a^2 + b^2 - 2ab\\cos C\\).", solution: "Standard." },
          { type: "regular", q: "Area: \\(a=4, b=6, C=30°\\)?", answer: "6.", solution: "\\(\\tfrac{1}{2}(4)(6)\\sin 30\\)." },
          { type: "regular", q: "Triangle 5-12-13 — right triangle?", answer: "Yes.", solution: "Pythagorean triple." },
          { type: "word", q: "Triangle: \\(A=30°, a=10, B=45°\\). Find \\(b\\).", answer: "\\(10\\sqrt{2}\\).", solution: "\\(\\tfrac{10}{\\sin 30} = \\tfrac{b}{\\sin 45}\\)." },
          { type: "word", q: "Sides 7, 10, included \\(60°\\). Third side?", answer: "\\(\\sqrt{79}\\).", solution: "\\(c^2 = 49 + 100 - 70\\)." }
        ]
      }
    }
  ]
};
