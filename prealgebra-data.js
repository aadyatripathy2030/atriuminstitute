// Pre-Algebra course — based on OpenStax Prealgebra.
const PREALGEBRA_COURSE = {
  id: "prealgebra",
  title: "Pre-Algebra",
  subtitle: "Numbers, operations, and the language of algebra",
  emoji: "🔢",
  accent: "#c38a3f",
  accent2: "#e4b473",
  description: "Eleven chapters from whole numbers and fractions through linear equations, polynomials, and graphs.",
  books: [
    {
      id: "p1", num: 1, title: "Whole Numbers", subtitle: "Place value, rounding, operations",
      emoji: "🔟", accent: "#c38a3f", accent2: "#e4b473",
      sections: [
        {
          title: "Place Value and Naming Numbers",
          questions: [
            { type: "regular", q: "What's the place value of the 7 in 57,432?", answer: "Thousands.", solution: "Reading right to left: ones, tens, hundreds, thousands — 7 is in thousands." },
            { type: "regular", q: "Write 4,082 in words.", answer: "Four thousand, eighty-two.", solution: "Name each period; skip empty hundreds." },
            { type: "regular", q: "Write \"six thousand, five hundred eleven\" in digits.", answer: "6,511.", solution: "6 thousand, 5 hundreds, 1 ten, 1 one." },
            { type: "regular", q: "What is the value of the digit 3 in 936,125?", answer: "30,000.", solution: "3 is in ten-thousands place." },
            { type: "word", q: "A stadium holds 45,238 people. Write this in words.", answer: "Forty-five thousand, two hundred thirty-eight.", solution: "Name each period in order." }
          ]
        },
        {
          title: "Rounding and Comparing",
          questions: [
            { type: "regular", q: "Round 763 to the nearest ten.", answer: "760.", solution: "Ones digit 3 < 5, so round down." },
            { type: "regular", q: "Round 4,582 to the nearest hundred.", answer: "4,600.", solution: "Tens digit 8 ≥ 5, round up." },
            { type: "regular", q: "Which is larger: 12,450 or 12,540?", answer: "12,540.", solution: "Compare place-by-place: tens digit differs." },
            { type: "regular", q: "Round 899 to the nearest ten.", answer: "900.", solution: "9 ≥ 5, round up; the tens becomes 0, hundreds increases." },
            { type: "word", q: "A town has 27,845 people. Round to the nearest thousand.", answer: "28,000.", solution: "Hundreds digit 8 ≥ 5, round up." }
          ]
        },
        {
          title: "Operations with Whole Numbers",
          questions: [
            { type: "regular", q: "Compute \\(348 + 267\\).", answer: "615.", solution: "Add column by column with carries." },
            { type: "regular", q: "Compute \\(903 - 576\\).", answer: "327.", solution: "Subtract with borrowing." },
            { type: "regular", q: "Compute \\(24 \\times 37\\).", answer: "888.", solution: "\\(24 \\cdot 37 = 24(30) + 24(7) = 720 + 168\\)." },
            { type: "regular", q: "Compute \\(525 \\div 15\\).", answer: "35.", solution: "\\(15 \\cdot 35 = 525\\)." },
            { type: "word", q: "A theater has 18 rows of 24 seats each. Total seats?", answer: "432 seats.", solution: "\\(18 \\cdot 24 = 432\\)." }
          ]
        }
      ],
      cumulativeTest: {
        title: "Cumulative Test — Whole Numbers",
        questions: [
          { type: "regular", q: "Place value of 5 in 254,813?", answer: "Ten-thousands.", solution: "Counting from the right." },
          { type: "regular", q: "Round 6,487 to the nearest hundred.", answer: "6,500.", solution: "Tens digit 8 ≥ 5." },
          { type: "regular", q: "Write 32,006 in words.", answer: "Thirty-two thousand, six.", solution: "Name periods." },
          { type: "regular", q: "\\(412 + 589\\)?", answer: "1,001.", solution: "Add with carries." },
          { type: "word", q: "A warehouse stores 48 boxes per shelf and has 25 shelves. Total boxes?", answer: "1,200.", solution: "\\(48 \\cdot 25\\)." },
          { type: "word", q: "A stadium has 68,500 seats. Round to the nearest ten-thousand.", answer: "70,000.", solution: "Thousands digit 8 ≥ 5." }
        ]
      }
    },
    {
      id: "p2", num: 2, title: "Language of Algebra", subtitle: "Variables, expressions, order of operations",
      emoji: "🔤", accent: "#b07850", accent2: "#d1a787",
      sections: [
        {
          title: "Variables, Expressions, Equations",
          questions: [
            { type: "regular", q: "Is \\(3x + 5\\) an expression or an equation?", answer: "Expression.", solution: "No equals sign." },
            { type: "regular", q: "Write \"5 more than a number \\(n\\)\" as an expression.", answer: "\\(n + 5\\).", solution: "\"More than\" means add." },
            { type: "regular", q: "Write \"twice \\(x\\) minus 7\" as an expression.", answer: "\\(2x - 7\\).", solution: "Twice means multiply by 2." },
            { type: "regular", q: "Identify the coefficient and constant in \\(4x - 9\\).", answer: "Coefficient 4, constant \\(-9\\).", solution: "Coefficient multiplies the variable; constant stands alone." },
            { type: "word", q: "Translate: \"a number decreased by 12 equals 30.\"", answer: "\\(n - 12 = 30\\).", solution: "\"Decreased\" = subtract; \"equals\" = \\(=\\)." }
          ]
        },
        {
          title: "Order of Operations (PEMDAS)",
          questions: [
            { type: "regular", q: "Compute \\(3 + 4 \\cdot 5\\).", answer: "23.", solution: "Multiply first: \\(20 + 3\\)." },
            { type: "regular", q: "Compute \\((3 + 4) \\cdot 5\\).", answer: "35.", solution: "Parentheses first." },
            { type: "regular", q: "Compute \\(2^3 + 6 \\div 2\\).", answer: "11.", solution: "Exponent: 8. Divide: 3. Add: 11." },
            { type: "regular", q: "Compute \\(18 - 2(3 + 1)\\).", answer: "10.", solution: "Parentheses: 4. Multiply: 8. Subtract: 10." },
            { type: "word", q: "Evaluate \\(4 + 3^2 \\cdot 2 - 5\\).", answer: "17.", solution: "\\(9 \\cdot 2 = 18\\); \\(4 + 18 - 5 = 17\\)." }
          ]
        },
        {
          title: "Evaluating Expressions",
          questions: [
            { type: "regular", q: "Evaluate \\(3x + 2\\) when \\(x = 5\\).", answer: "17.", solution: "\\(3(5) + 2\\)." },
            { type: "regular", q: "Evaluate \\(x^2 - 4\\) when \\(x = 3\\).", answer: "5.", solution: "\\(9 - 4\\)." },
            { type: "regular", q: "Evaluate \\(2a + 3b\\) when \\(a = 4\\), \\(b = 1\\).", answer: "11.", solution: "\\(8 + 3\\)." },
            { type: "regular", q: "Evaluate \\(\\dfrac{y + 5}{2}\\) when \\(y = 7\\).", answer: "6.", solution: "\\(12/2\\)." },
            { type: "word", q: "A taxi costs \\(C = 3 + 2m\\) dollars for \\(m\\) miles. Find \\(C\\) when \\(m = 8\\).", answer: "$19.", solution: "\\(3 + 16\\)." }
          ]
        }
      ],
      cumulativeTest: {
        title: "Cumulative Test — Language of Algebra",
        questions: [
          { type: "regular", q: "Translate \"7 less than twice a number\".", answer: "\\(2n - 7\\).", solution: "Twice = \\(2n\\); less than 7 = subtract 7." },
          { type: "regular", q: "Compute \\(5 + 2 \\cdot 3^2\\).", answer: "23.", solution: "Exp: 9. Mult: 18. Add: 23." },
          { type: "regular", q: "Evaluate \\(4x - 5\\) at \\(x = 3\\).", answer: "7.", solution: "\\(12 - 5\\)." },
          { type: "regular", q: "Compute \\((8 - 3)^2 + 1\\).", answer: "26.", solution: "\\(5^2 + 1\\)." },
          { type: "word", q: "Phone costs \\(C = 25 + 0.05t\\) for \\(t\\) texts. Find \\(C\\) at 200 texts.", answer: "$35.", solution: "\\(25 + 10\\)." },
          { type: "word", q: "Translate: \"the sum of a number and its square equals 20.\"", answer: "\\(n + n^2 = 20\\).", solution: "Sum = add; square = \\(n^2\\)." }
        ]
      }
    },
    {
      id: "p3", num: 3, title: "Integers", subtitle: "Negatives, number line, equations",
      emoji: "➖", accent: "#8a6fa0", accent2: "#b299c0",
      sections: [
        {
          title: "Adding & Subtracting Integers",
          questions: [
            { type: "regular", q: "Compute \\(-7 + 4\\).", answer: "\\(-3\\).", solution: "Different signs → subtract magnitudes, keep larger sign." },
            { type: "regular", q: "Compute \\(-5 - 8\\).", answer: "\\(-13\\).", solution: "Same sign → add magnitudes, keep sign." },
            { type: "regular", q: "Compute \\(3 - (-6)\\).", answer: "9.", solution: "Subtracting a negative = adding." },
            { type: "regular", q: "Compute \\(-12 + 12\\).", answer: "0.", solution: "Additive inverses." },
            { type: "word", q: "The temperature drops from \\(5°\\text{F}\\) to \\(-8°\\text{F}\\). How many degrees did it drop?", answer: "13°F.", solution: "\\(5 - (-8) = 13\\)." }
          ]
        },
        {
          title: "Multiplying & Dividing Integers",
          questions: [
            { type: "regular", q: "Compute \\(-6 \\cdot 4\\).", answer: "\\(-24\\).", solution: "Different signs → negative product." },
            { type: "regular", q: "Compute \\(-8 \\cdot (-3)\\).", answer: "24.", solution: "Same signs → positive." },
            { type: "regular", q: "Compute \\(-36 \\div 9\\).", answer: "\\(-4\\).", solution: "Different signs → negative quotient." },
            { type: "regular", q: "Compute \\((-2)^3\\).", answer: "\\(-8\\).", solution: "\\(-2 \\cdot -2 \\cdot -2\\)." },
            { type: "word", q: "A submarine descends 15 ft/min for 6 minutes. What's its change in depth?", answer: "\\(-90\\) ft.", solution: "\\(-15 \\cdot 6\\)." }
          ]
        },
        {
          title: "Solving Equations with Integers",
          questions: [
            { type: "regular", q: "Solve \\(x + 7 = 3\\).", answer: "\\(x = -4\\).", solution: "Subtract 7." },
            { type: "regular", q: "Solve \\(-5x = 30\\).", answer: "\\(x = -6\\).", solution: "Divide by \\(-5\\)." },
            { type: "regular", q: "Solve \\(y - 9 = -2\\).", answer: "\\(y = 7\\).", solution: "Add 9." },
            { type: "regular", q: "Solve \\(\\dfrac{x}{-4} = 3\\).", answer: "\\(x = -12\\).", solution: "Multiply both sides by \\(-4\\)." },
            { type: "word", q: "A balance drops $20 per week. After \\(w\\) weeks it's \\(-\\)$60. Find \\(w\\).", answer: "3 weeks.", solution: "\\(-20w = -60\\)." }
          ]
        }
      ],
      cumulativeTest: {
        title: "Cumulative Test — Integers",
        questions: [
          { type: "regular", q: "\\(-9 + 4\\)?", answer: "\\(-5\\).", solution: "Subtract magnitudes." },
          { type: "regular", q: "\\(-3 \\cdot -7\\)?", answer: "21.", solution: "Same signs → positive." },
          { type: "regular", q: "\\(\\dfrac{-48}{6}\\)?", answer: "\\(-8\\).", solution: "Different signs." },
          { type: "regular", q: "Solve \\(x + 5 = -2\\).", answer: "\\(x = -7\\).", solution: "Subtract 5." },
          { type: "word", q: "Elevation starts at \\(-120\\) ft and rises 35 ft. New elevation?", answer: "\\(-85\\) ft.", solution: "\\(-120 + 35\\)." },
          { type: "word", q: "A thermometer reads \\(-4°\\text{C}\\), then drops \\(6°\\). New temperature?", answer: "\\(-10°\\text{C}\\).", solution: "\\(-4 - 6\\)." }
        ]
      }
    },
    {
      id: "p4", num: 4, title: "Fractions", subtitle: "Equivalent, operations, equations",
      emoji: "🍕", accent: "#bc6060", accent2: "#d99494",
      sections: [
        {
          title: "Equivalent Fractions & Simplifying",
          questions: [
            { type: "regular", q: "Simplify \\(\\dfrac{12}{18}\\).", answer: "\\(\\dfrac{2}{3}\\).", solution: "Divide top and bottom by 6." },
            { type: "regular", q: "Write \\(\\dfrac{3}{4}\\) with denominator 20.", answer: "\\(\\dfrac{15}{20}\\).", solution: "Multiply by \\(5/5\\)." },
            { type: "regular", q: "Simplify \\(\\dfrac{36}{48}\\).", answer: "\\(\\dfrac{3}{4}\\).", solution: "GCD 12." },
            { type: "regular", q: "Are \\(\\dfrac{2}{5}\\) and \\(\\dfrac{6}{15}\\) equivalent?", answer: "Yes.", solution: "\\(\\dfrac{6}{15}\\) simplifies to \\(\\dfrac{2}{5}\\)." },
            { type: "word", q: "A pizza is cut into 12 slices and 8 are eaten. Simplify the fraction eaten.", answer: "\\(\\dfrac{2}{3}\\).", solution: "\\(\\dfrac{8}{12}\\) → divide by 4." }
          ]
        },
        {
          title: "Multiplying & Dividing Fractions",
          questions: [
            { type: "regular", q: "Compute \\(\\dfrac{2}{3} \\cdot \\dfrac{3}{4}\\).", answer: "\\(\\dfrac{1}{2}\\).", solution: "\\(\\dfrac{6}{12}\\) simplifies." },
            { type: "regular", q: "Compute \\(\\dfrac{5}{6} \\div \\dfrac{1}{3}\\).", answer: "\\(\\dfrac{5}{2}\\).", solution: "Multiply by reciprocal: \\(\\dfrac{5}{6} \\cdot 3\\)." },
            { type: "regular", q: "Compute \\(\\dfrac{3}{8} \\cdot 4\\).", answer: "\\(\\dfrac{3}{2}\\).", solution: "\\(\\dfrac{12}{8}\\) simplifies." },
            { type: "regular", q: "Compute \\(\\dfrac{4}{5} \\div \\dfrac{8}{15}\\).", answer: "\\(\\dfrac{3}{2}\\).", solution: "\\(\\dfrac{4}{5} \\cdot \\dfrac{15}{8} = \\dfrac{60}{40}\\)." },
            { type: "word", q: "A recipe uses \\(\\dfrac{2}{3}\\) cup sugar; you make 3 batches. Total sugar?", answer: "2 cups.", solution: "\\(\\dfrac{2}{3} \\cdot 3\\)." }
          ]
        },
        {
          title: "Adding & Subtracting Fractions",
          questions: [
            { type: "regular", q: "Compute \\(\\dfrac{1}{4} + \\dfrac{2}{4}\\).", answer: "\\(\\dfrac{3}{4}\\).", solution: "Same denominator, add numerators." },
            { type: "regular", q: "Compute \\(\\dfrac{1}{3} + \\dfrac{1}{4}\\).", answer: "\\(\\dfrac{7}{12}\\).", solution: "LCD 12: \\(\\dfrac{4}{12} + \\dfrac{3}{12}\\)." },
            { type: "regular", q: "Compute \\(\\dfrac{5}{6} - \\dfrac{1}{3}\\).", answer: "\\(\\dfrac{1}{2}\\).", solution: "\\(\\dfrac{5}{6} - \\dfrac{2}{6} = \\dfrac{3}{6}\\)." },
            { type: "regular", q: "Compute \\(2\\dfrac{1}{2} + 1\\dfrac{1}{4}\\).", answer: "\\(3\\dfrac{3}{4}\\).", solution: "\\(\\dfrac{5}{2} + \\dfrac{5}{4} = \\dfrac{15}{4}\\)." },
            { type: "word", q: "You walk \\(\\dfrac{3}{4}\\) mile then \\(\\dfrac{5}{8}\\) mile. Total distance?", answer: "\\(1\\dfrac{3}{8}\\) miles.", solution: "\\(\\dfrac{6}{8} + \\dfrac{5}{8} = \\dfrac{11}{8}\\)." }
          ]
        }
      ],
      cumulativeTest: {
        title: "Cumulative Test — Fractions",
        questions: [
          { type: "regular", q: "Simplify \\(\\dfrac{24}{40}\\).", answer: "\\(\\dfrac{3}{5}\\).", solution: "Divide by 8." },
          { type: "regular", q: "\\(\\dfrac{3}{4} \\cdot \\dfrac{2}{9}\\)?", answer: "\\(\\dfrac{1}{6}\\).", solution: "\\(\\dfrac{6}{36}\\) simplifies." },
          { type: "regular", q: "\\(\\dfrac{5}{6} - \\dfrac{1}{4}\\)?", answer: "\\(\\dfrac{7}{12}\\).", solution: "LCD 12: \\(\\dfrac{10}{12} - \\dfrac{3}{12}\\)." },
          { type: "regular", q: "\\(\\dfrac{7}{8} \\div \\dfrac{1}{2}\\)?", answer: "\\(\\dfrac{7}{4}\\).", solution: "Multiply by 2." },
          { type: "word", q: "A board is \\(5\\dfrac{1}{2}\\) ft and you cut off \\(1\\dfrac{3}{4}\\) ft. How much is left?", answer: "\\(3\\dfrac{3}{4}\\) ft.", solution: "\\(\\dfrac{11}{2} - \\dfrac{7}{4} = \\dfrac{15}{4}\\)." },
          { type: "word", q: "Share \\(\\dfrac{3}{4}\\) pizza among 3 people. Each gets?", answer: "\\(\\dfrac{1}{4}\\) pizza.", solution: "\\(\\dfrac{3}{4} \\div 3\\)." }
        ]
      }
    },
    {
      id: "p5", num: 5, title: "Decimals", subtitle: "Operations, conversions, square roots",
      emoji: "🔢", accent: "#5a8d88", accent2: "#97b9b5",
      sections: [
        {
          title: "Decimals Basics",
          questions: [
            { type: "regular", q: "Write 0.25 as a fraction in simplest form.", answer: "\\(\\dfrac{1}{4}\\).", solution: "\\(\\dfrac{25}{100}\\) simplifies." },
            { type: "regular", q: "Round 3.647 to the nearest tenth.", answer: "3.6.", solution: "Hundredths digit 4 < 5." },
            { type: "regular", q: "Which is larger: 0.72 or 0.8?", answer: "0.8.", solution: "Line up decimals: 0.80 > 0.72." },
            { type: "regular", q: "What is the place value of the 5 in 4.0352?", answer: "Thousandths.", solution: "Tenths, hundredths, thousandths." },
            { type: "word", q: "A coin weighs 2.268 grams. Round to the nearest hundredth.", answer: "2.27 g.", solution: "Thousandths digit 8 ≥ 5." }
          ]
        },
        {
          title: "Operations with Decimals",
          questions: [
            { type: "regular", q: "Compute \\(2.3 + 4.75\\).", answer: "7.05.", solution: "Line up decimals; add." },
            { type: "regular", q: "Compute \\(6.5 - 2.78\\).", answer: "3.72.", solution: "Line up; subtract with borrow." },
            { type: "regular", q: "Compute \\(0.4 \\cdot 0.3\\).", answer: "0.12.", solution: "Multiply: 12. Two decimal places total." },
            { type: "regular", q: "Compute \\(7.2 \\div 0.6\\).", answer: "12.", solution: "Shift decimals: \\(72 \\div 6\\)." },
            { type: "word", q: "A sandwich is $4.75 and a drink is $2.50. Total?", answer: "$7.25.", solution: "Add the two prices." }
          ]
        },
        {
          title: "Conversions & Square Roots",
          questions: [
            { type: "regular", q: "Convert \\(\\dfrac{3}{5}\\) to a decimal.", answer: "0.6.", solution: "\\(3 \\div 5\\)." },
            { type: "regular", q: "Convert 0.45 to a fraction in simplest form.", answer: "\\(\\dfrac{9}{20}\\).", solution: "\\(\\dfrac{45}{100}\\) → divide by 5." },
            { type: "regular", q: "Find \\(\\sqrt{49}\\).", answer: "7.", solution: "\\(7^2 = 49\\)." },
            { type: "regular", q: "Approximate \\(\\sqrt{50}\\) (nearest tenth).", answer: "7.1.", solution: "\\(7^2 = 49\\), \\(7.1^2 = 50.41\\)." },
            { type: "word", q: "A square has area 81 sq ft. Side length?", answer: "9 ft.", solution: "\\(\\sqrt{81} = 9\\)." }
          ]
        }
      ],
      cumulativeTest: {
        title: "Cumulative Test — Decimals",
        questions: [
          { type: "regular", q: "Round 5.872 to the nearest tenth.", answer: "5.9.", solution: "Hundredths digit 7 ≥ 5." },
          { type: "regular", q: "\\(1.4 + 2.85\\)?", answer: "4.25.", solution: "Line up decimals." },
          { type: "regular", q: "\\(0.3 \\cdot 0.5\\)?", answer: "0.15.", solution: "\\(15\\); two decimal places." },
          { type: "regular", q: "\\(\\sqrt{144}\\)?", answer: "12.", solution: "\\(12^2 = 144\\)." },
          { type: "word", q: "Convert \\(\\dfrac{7}{8}\\) to a decimal.", answer: "0.875.", solution: "\\(7 \\div 8\\)." },
          { type: "word", q: "A meal costs $18.75 with a $3.25 tax. Total bill?", answer: "$22.00.", solution: "Add." }
        ]
      }
    },
    {
      id: "p6", num: 6, title: "Percents", subtitle: "Conversions, percent of, applications",
      emoji: "💯", accent: "#56a56b", accent2: "#8fc79f",
      sections: [
        {
          title: "Percent Basics & Conversions",
          questions: [
            { type: "regular", q: "Convert 35% to a decimal.", answer: "0.35.", solution: "Divide by 100." },
            { type: "regular", q: "Convert 0.08 to a percent.", answer: "8%.", solution: "Multiply by 100." },
            { type: "regular", q: "Convert \\(\\dfrac{3}{4}\\) to a percent.", answer: "75%.", solution: "\\(0.75 \\cdot 100\\)." },
            { type: "regular", q: "Convert 120% to a decimal.", answer: "1.2.", solution: "Divide by 100." },
            { type: "word", q: "A score of 0.85 is what percent?", answer: "85%.", solution: "Shift decimal right." }
          ]
        },
        {
          title: "Percent of a Number",
          questions: [
            { type: "regular", q: "What is 20% of 80?", answer: "16.", solution: "\\(0.2 \\cdot 80\\)." },
            { type: "regular", q: "What is 15% of 200?", answer: "30.", solution: "\\(0.15 \\cdot 200\\)." },
            { type: "regular", q: "12 is what percent of 48?", answer: "25%.", solution: "\\(12/48 = 0.25\\)." },
            { type: "regular", q: "75% of what number is 30?", answer: "40.", solution: "\\(30/0.75\\)." },
            { type: "word", q: "A class has 30 students. If 40% are seniors, how many are seniors?", answer: "12.", solution: "\\(0.4 \\cdot 30\\)." }
          ]
        },
        {
          title: "Percent Applications",
          questions: [
            { type: "regular", q: "A $50 jacket is 20% off. Sale price?", answer: "$40.", solution: "\\(50 - 0.2(50)\\)." },
            { type: "regular", q: "Sales tax is 8% on a $25 item. Tax amount?", answer: "$2.00.", solution: "\\(0.08 \\cdot 25\\)." },
            { type: "regular", q: "Simple interest: \\(P = 500\\), \\(r = 5\\%\\), \\(t = 2\\) years. Interest?", answer: "$50.", solution: "\\(I = Prt = 500(0.05)(2)\\)." },
            { type: "regular", q: "A waiter earns 18% tip on a $40 bill. Tip?", answer: "$7.20.", solution: "\\(0.18 \\cdot 40\\)." },
            { type: "word", q: "A $120 game is 25% off, then 8% tax. Final price?", answer: "$97.20.", solution: "\\(120 \\cdot 0.75 = 90\\); \\(90 \\cdot 1.08 = 97.20\\)." }
          ]
        }
      ],
      cumulativeTest: {
        title: "Cumulative Test — Percents",
        questions: [
          { type: "regular", q: "Convert 0.12 to a percent.", answer: "12%.", solution: "Shift decimal." },
          { type: "regular", q: "25% of 80?", answer: "20.", solution: "\\(0.25 \\cdot 80\\)." },
          { type: "regular", q: "15 is what percent of 60?", answer: "25%.", solution: "\\(15/60\\)." },
          { type: "regular", q: "Convert \\(\\dfrac{2}{5}\\) to a percent.", answer: "40%.", solution: "\\(0.4 \\cdot 100\\)." },
          { type: "word", q: "A $60 shirt is 30% off. Sale price?", answer: "$42.", solution: "\\(60(1 - 0.30)\\)." },
          { type: "word", q: "10% tip on a $32 bill.", answer: "$3.20.", solution: "\\(0.10 \\cdot 32\\)." }
        ]
      }
    },
    {
      id: "p7", num: 7, title: "Properties of Real Numbers", subtitle: "Commutative, associative, distributive",
      emoji: "🔁", accent: "#6977a8", accent2: "#9ba5c9",
      sections: [
        {
          title: "Commutative & Associative",
          questions: [
            { type: "regular", q: "Which property: \\(3 + 5 = 5 + 3\\)?", answer: "Commutative (addition).", solution: "Order can change for addition/multiplication." },
            { type: "regular", q: "Which property: \\((2 \\cdot 3) \\cdot 4 = 2 \\cdot (3 \\cdot 4)\\)?", answer: "Associative (multiplication).", solution: "Grouping can change." },
            { type: "regular", q: "Is subtraction commutative?", answer: "No.", solution: "\\(5 - 3 \\ne 3 - 5\\)." },
            { type: "regular", q: "Rewrite \\(2 + x + 5\\) using commutative.", answer: "\\(x + 7\\).", solution: "Reorder, then combine constants." },
            { type: "word", q: "You pay $4 for fries, $7 for a burger, $3 for a drink. Explain why adding them in any order gives the same total.", answer: "Commutative property of addition.", solution: "Order doesn't change the sum." }
          ]
        },
        {
          title: "Distributive Property",
          questions: [
            { type: "regular", q: "Distribute: \\(3(x + 4)\\).", answer: "\\(3x + 12\\).", solution: "Multiply 3 into each term." },
            { type: "regular", q: "Distribute: \\(-2(3y - 5)\\).", answer: "\\(-6y + 10\\).", solution: "Multiply \\(-2\\) into each term." },
            { type: "regular", q: "Simplify \\(5(2x + 3) - 4\\).", answer: "\\(10x + 11\\).", solution: "Distribute then combine constants." },
            { type: "regular", q: "Distribute: \\(x(x - 7)\\).", answer: "\\(x^2 - 7x\\).", solution: "Multiply \\(x\\) into each term." },
            { type: "word", q: "A store sells 3 shirts at \\$p\\) each and 3 pants at $25 each. Total cost?", answer: "\\(3(p + 25) = 3p + 75\\).", solution: "Distribute 3." }
          ]
        },
        {
          title: "Identity & Inverse",
          questions: [
            { type: "regular", q: "What is the additive identity?", answer: "0.", solution: "\\(a + 0 = a\\)." },
            { type: "regular", q: "What is the multiplicative identity?", answer: "1.", solution: "\\(a \\cdot 1 = a\\)." },
            { type: "regular", q: "Additive inverse of \\(-7\\)?", answer: "7.", solution: "Sum to 0." },
            { type: "regular", q: "Multiplicative inverse of \\(\\dfrac{2}{3}\\)?", answer: "\\(\\dfrac{3}{2}\\).", solution: "Flip to get reciprocal." },
            { type: "word", q: "Why does multiplying any number by 1 leave it unchanged?", answer: "1 is the multiplicative identity.", solution: "Definition of identity element." }
          ]
        }
      ],
      cumulativeTest: {
        title: "Cumulative Test — Properties of Real Numbers",
        questions: [
          { type: "regular", q: "Name the property: \\(x + 0 = x\\).", answer: "Additive identity.", solution: "0 is the identity for addition." },
          { type: "regular", q: "Distribute \\(4(2x + 3)\\).", answer: "\\(8x + 12\\).", solution: "Multiply each term." },
          { type: "regular", q: "Reciprocal of 5?", answer: "\\(\\dfrac{1}{5}\\).", solution: "Multiplicative inverse." },
          { type: "regular", q: "Simplify \\(2(x + 1) + 3(x - 4)\\).", answer: "\\(5x - 10\\).", solution: "Distribute and combine." },
          { type: "word", q: "Additive inverse of \\(\\dfrac{3}{4}\\)?", answer: "\\(-\\dfrac{3}{4}\\).", solution: "Negate." },
          { type: "word", q: "Is \\(3(4 + 5) = 3 \\cdot 4 + 3 \\cdot 5\\) an example of which property?", answer: "Distributive.", solution: "Multiplication distributes over addition." }
        ]
      }
    },
    {
      id: "p8", num: 8, title: "Solving Linear Equations", subtitle: "One-step, multi-step, both sides",
      emoji: "⚖️", accent: "#4a6fa5", accent2: "#7c94c2",
      sections: [
        {
          title: "One-Step Equations",
          questions: [
            { type: "regular", q: "Solve \\(x + 5 = 12\\).", answer: "\\(x = 7\\).", solution: "Subtract 5." },
            { type: "regular", q: "Solve \\(x - 3 = 9\\).", answer: "\\(x = 12\\).", solution: "Add 3." },
            { type: "regular", q: "Solve \\(4x = 20\\).", answer: "\\(x = 5\\).", solution: "Divide by 4." },
            { type: "regular", q: "Solve \\(\\dfrac{x}{3} = 6\\).", answer: "\\(x = 18\\).", solution: "Multiply by 3." },
            { type: "word", q: "Maya paid with a $20 bill and received $3 in change. How much did her book cost \\(x\\)?", answer: "\\(x = 17\\).", solution: "\\(20 - x = 3 \\Rightarrow x = 17\\)." }
          ]
        },
        {
          title: "Multi-Step Equations",
          questions: [
            { type: "regular", q: "Solve \\(2x + 5 = 13\\).", answer: "\\(x = 4\\).", solution: "Subtract 5, divide by 2." },
            { type: "regular", q: "Solve \\(3x - 7 = 14\\).", answer: "\\(x = 7\\).", solution: "Add 7, divide by 3." },
            { type: "regular", q: "Solve \\(\\dfrac{x}{2} + 3 = 10\\).", answer: "\\(x = 14\\).", solution: "Subtract 3, multiply by 2." },
            { type: "regular", q: "Solve \\(5(x - 2) = 15\\).", answer: "\\(x = 5\\).", solution: "Divide by 5, add 2 (or distribute first)." },
            { type: "word", q: "A gym charges $30/month plus a $50 setup fee. Total for \\(m\\) months is $200. Find \\(m\\).", answer: "5 months.", solution: "\\(30m + 50 = 200\\)." }
          ]
        },
        {
          title: "Variables on Both Sides",
          questions: [
            { type: "regular", q: "Solve \\(3x + 4 = x + 10\\).", answer: "\\(x = 3\\).", solution: "Subtract \\(x\\), subtract 4, divide by 2." },
            { type: "regular", q: "Solve \\(5x - 2 = 2x + 7\\).", answer: "\\(x = 3\\).", solution: "\\(3x = 9\\)." },
            { type: "regular", q: "Solve \\(2(x + 3) = 4x - 2\\).", answer: "\\(x = 4\\).", solution: "Distribute, subtract \\(2x\\), divide." },
            { type: "regular", q: "Solve \\(7 - 2x = 3x + 22\\).", answer: "\\(x = -3\\).", solution: "Add \\(2x\\), subtract 22, divide by 5." },
            { type: "word", q: "Party A charges $10 plus $2/mile; Party B charges $4/mile. At what distance is cost equal?", answer: "5 miles.", solution: "\\(10 + 2m = 4m\\)." }
          ]
        }
      ],
      cumulativeTest: {
        title: "Cumulative Test — Solving Linear Equations",
        questions: [
          { type: "regular", q: "Solve \\(x + 8 = 3\\).", answer: "\\(x = -5\\).", solution: "Subtract 8." },
          { type: "regular", q: "Solve \\(4x - 3 = 17\\).", answer: "\\(x = 5\\).", solution: "Add 3, divide by 4." },
          { type: "regular", q: "Solve \\(2(x + 1) = 10\\).", answer: "\\(x = 4\\).", solution: "Divide by 2, subtract 1." },
          { type: "regular", q: "Solve \\(3x + 2 = 2x + 9\\).", answer: "\\(x = 7\\).", solution: "Subtract \\(2x\\), subtract 2." },
          { type: "word", q: "A rental costs $25 base plus $3/hour. Total $46. How many hours?", answer: "7 hours.", solution: "\\(25 + 3h = 46\\)." },
          { type: "word", q: "Two numbers differ by 8; their sum is 20. Find them.", answer: "14 and 6.", solution: "\\(x + (x-8) = 20\\); \\(x = 14\\)." }
        ]
      }
    },
    {
      id: "p9", num: 9, title: "Math Models & Geometry", subtitle: "Word problems and shapes",
      emoji: "📐", accent: "#6a8f6a", accent2: "#a8c09a",
      sections: [
        {
          title: "Word Problems (Number, Coin, Mixture)",
          questions: [
            { type: "regular", q: "Two numbers sum to 30 and differ by 6. Find them.", answer: "18 and 12.", solution: "\\(x + y = 30, x - y = 6\\)." },
            { type: "regular", q: "Nine fewer than twice a number is 11. Find it.", answer: "10.", solution: "\\(2n - 9 = 11\\)." },
            { type: "regular", q: "Nickels and dimes total 12 coins, worth $0.95. How many dimes?", answer: "7 dimes.", solution: "\\(n + d = 12,\\ 5n + 10d = 95\\)." },
            { type: "regular", q: "The perimeter of a rectangle is 36 in. and the length is 4 more than the width. Find the width.", answer: "7 in.", solution: "\\(2w + 2(w+4) = 36 \\Rightarrow 4w + 8 = 36 \\Rightarrow w = 7\\)." },
            { type: "word", q: "A mix is 40% juice. How much pure juice is in 500 mL?", answer: "200 mL.", solution: "\\(0.4 \\cdot 500\\)." }
          ]
        },
        {
          title: "Perimeter and Area",
          questions: [
            { type: "regular", q: "Perimeter of a rectangle 5×8?", answer: "26.", solution: "\\(2(5+8)\\)." },
            { type: "regular", q: "Area of a triangle base 10, height 6?", answer: "30.", solution: "\\(\\tfrac{1}{2}bh\\)." },
            { type: "regular", q: "Circumference of a circle radius 7 (use \\(\\pi \\approx 3.14\\)).", answer: "≈ 43.96.", solution: "\\(2\\pi r = 14\\pi \\approx 43.96\\)." },
            { type: "regular", q: "Area of a circle radius 5 (exact)?", answer: "\\(25\\pi\\).", solution: "\\(\\pi r^2\\)." },
            { type: "word", q: "A rectangular garden is 12 ft × 15 ft. Fence needed?", answer: "54 ft.", solution: "Perimeter \\(2(12+15)\\)." }
          ]
        },
        {
          title: "Volume & Surface Area",
          questions: [
            { type: "regular", q: "Volume of a cube with edge 4?", answer: "64.", solution: "\\(4^3\\)." },
            { type: "regular", q: "Volume of a rectangular prism 3×4×5?", answer: "60.", solution: "Multiply dimensions." },
            { type: "regular", q: "Surface area of a cube with edge 3?", answer: "54.", solution: "\\(6 \\cdot 9\\)." },
            { type: "regular", q: "Volume of a cylinder radius 2, height 10?", answer: "\\(40\\pi\\).", solution: "\\(\\pi r^2 h\\)." },
            { type: "word", q: "A shoe box is 12×7×5 inches. Volume?", answer: "420 cubic in.", solution: "Multiply dimensions." }
          ]
        }
      ],
      cumulativeTest: {
        title: "Cumulative Test — Math Models & Geometry",
        questions: [
          { type: "regular", q: "Perimeter of a square side 9?", answer: "36.", solution: "\\(4s\\)." },
          { type: "regular", q: "Area of a rectangle 6×8?", answer: "48.", solution: "\\(lw\\)." },
          { type: "regular", q: "Volume of a cube edge 5?", answer: "125.", solution: "\\(s^3\\)." },
          { type: "regular", q: "Circumference of circle radius 10 (exact)?", answer: "\\(20\\pi\\).", solution: "\\(2\\pi r\\)." },
          { type: "word", q: "Three consecutive integers sum to 42. Find them.", answer: "13, 14, 15.", solution: "\\(3n + 3 = 42\\)." },
          { type: "word", q: "A garden is twice as long as wide. Perimeter 60 ft. Find width.", answer: "10 ft.", solution: "\\(2w + 2(2w) = 60\\)." }
        ]
      }
    },
    {
      id: "p10", num: 10, title: "Polynomials", subtitle: "Adding, multiplying, exponents",
      emoji: "✖️", accent: "#a05b91", accent2: "#c893b9",
      sections: [
        {
          title: "Adding & Subtracting Polynomials",
          questions: [
            { type: "regular", q: "Add \\((3x + 5) + (2x - 8)\\).", answer: "\\(5x - 3\\).", solution: "Combine like terms." },
            { type: "regular", q: "Subtract \\((4x^2 - 2x + 1) - (x^2 + 3x - 5)\\).", answer: "\\(3x^2 - 5x + 6\\).", solution: "Distribute minus, combine." },
            { type: "regular", q: "Simplify \\(3x + 7 - 2x + 4\\).", answer: "\\(x + 11\\).", solution: "Combine like terms." },
            { type: "regular", q: "Add \\(2x^2 + 3x\\) and \\(5x^2 - x\\).", answer: "\\(7x^2 + 2x\\).", solution: "Combine like terms." },
            { type: "word", q: "A rectangle has length \\(2x + 3\\) and width \\(x + 5\\). Find perimeter.", answer: "\\(6x + 16\\).", solution: "\\(2(2x+3) + 2(x+5)\\)." }
          ]
        },
        {
          title: "Multiplying Monomials & Polynomials",
          questions: [
            { type: "regular", q: "Compute \\(3x \\cdot 2x^2\\).", answer: "\\(6x^3\\).", solution: "Multiply coefficients, add exponents." },
            { type: "regular", q: "Expand \\(x(x + 4)\\).", answer: "\\(x^2 + 4x\\).", solution: "Distribute." },
            { type: "regular", q: "Expand \\((x + 2)(x + 3)\\).", answer: "\\(x^2 + 5x + 6\\).", solution: "FOIL." },
            { type: "regular", q: "Expand \\((x - 4)(x + 4)\\).", answer: "\\(x^2 - 16\\).", solution: "Difference of squares." },
            { type: "word", q: "A rectangle has length \\(x + 5\\) and width \\(x + 2\\). Area?", answer: "\\(x^2 + 7x + 10\\).", solution: "FOIL." }
          ]
        },
        {
          title: "Exponents & Scientific Notation",
          questions: [
            { type: "regular", q: "Simplify \\(x^5 \\cdot x^3\\).", answer: "\\(x^8\\).", solution: "Add exponents." },
            { type: "regular", q: "Simplify \\(\\dfrac{x^8}{x^2}\\).", answer: "\\(x^6\\).", solution: "Subtract exponents." },
            { type: "regular", q: "Write \\(0.00045\\) in scientific notation.", answer: "\\(4.5 \\times 10^{-4}\\).", solution: "Move decimal 4 places right." },
            { type: "regular", q: "Simplify \\((2x^3)^2\\).", answer: "\\(4x^6\\).", solution: "Square each factor." },
            { type: "word", q: "The distance to the sun is about 93,000,000 miles. Write in scientific notation.", answer: "\\(9.3 \\times 10^7\\).", solution: "Move decimal 7 places." }
          ]
        }
      ],
      cumulativeTest: {
        title: "Cumulative Test — Polynomials",
        questions: [
          { type: "regular", q: "Add \\((2x + 3) + (x - 1)\\).", answer: "\\(3x + 2\\).", solution: "Combine." },
          { type: "regular", q: "Expand \\((x + 1)(x + 4)\\).", answer: "\\(x^2 + 5x + 4\\).", solution: "FOIL." },
          { type: "regular", q: "Simplify \\(x^4 \\cdot x^2\\).", answer: "\\(x^6\\).", solution: "Add exponents." },
          { type: "regular", q: "Expand \\((x + 5)(x - 5)\\).", answer: "\\(x^2 - 25\\).", solution: "Difference of squares." },
          { type: "word", q: "Write 6,500,000 in scientific notation.", answer: "\\(6.5 \\times 10^6\\).", solution: "Move decimal 6 places." },
          { type: "word", q: "A rectangle has sides \\(2x\\) and \\(x + 3\\). Area?", answer: "\\(2x^2 + 6x\\).", solution: "Distribute." }
        ]
      }
    },
    {
      id: "p11", num: 11, title: "Graphs", subtitle: "Points, lines, slopes",
      emoji: "📈", accent: "#566fb0", accent2: "#97a7d3",
      sections: [
        {
          title: "Plotting Points",
          questions: [
            { type: "regular", q: "Name the quadrant of \\((5, -2)\\).", answer: "Quadrant IV.", solution: "Positive \\(x\\), negative \\(y\\)." },
            { type: "regular", q: "Is \\((0, 3)\\) on the x-axis or y-axis?", answer: "y-axis.", solution: "\\(x = 0\\)." },
            { type: "regular", q: "What are the coordinates of the origin?", answer: "\\((0, 0)\\).", solution: "By definition." },
            { type: "regular", q: "Which quadrant contains \\((-4, -1)\\)?", answer: "Quadrant III.", solution: "Both negative." },
            { type: "word", q: "Point A is 3 right and 5 up from origin. Coordinates?", answer: "\\((3, 5)\\).", solution: "Right = +x, up = +y." }
          ]
        },
        {
          title: "Graphing Linear Equations",
          questions: [
            { type: "regular", q: "Is \\((2, 7)\\) a solution to \\(y = 3x + 1\\)?", answer: "Yes.", solution: "\\(3(2) + 1 = 7\\)." },
            { type: "regular", q: "Find the y-intercept of \\(y = 2x - 5\\).", answer: "\\(-5\\).", solution: "Set \\(x = 0\\)." },
            { type: "regular", q: "Find the x-intercept of \\(2x + y = 6\\).", answer: "\\(x = 3\\).", solution: "Set \\(y = 0\\)." },
            { type: "regular", q: "Graph \\(y = x\\): list any 3 solutions.", answer: "\\((0,0), (1,1), (2,2)\\).", solution: "\\(x = y\\)." },
            { type: "word", q: "\\(y = 5x\\) models cost of \\(x\\) pounds of apples at $5/lb. Cost of 4 lbs?", answer: "$20.", solution: "\\(5 \\cdot 4\\)." }
          ]
        },
        {
          title: "Slope",
          questions: [
            { type: "regular", q: "Slope through \\((1, 2)\\) and \\((3, 8)\\)?", answer: "3.", solution: "\\((8-2)/(3-1)\\)." },
            { type: "regular", q: "Slope of a horizontal line?", answer: "0.", solution: "No rise." },
            { type: "regular", q: "Slope of a vertical line?", answer: "Undefined.", solution: "Zero run." },
            { type: "regular", q: "Slope through \\((0, 4)\\) and \\((2, 0)\\)?", answer: "\\(-2\\).", solution: "\\((0-4)/(2-0)\\)." },
            { type: "word", q: "A ramp rises 3 ft over 12 ft of run. Slope?", answer: "\\(\\dfrac{1}{4}\\).", solution: "\\(3/12\\)." }
          ]
        }
      ],
      cumulativeTest: {
        title: "Cumulative Test — Graphs",
        questions: [
          { type: "regular", q: "Quadrant of \\((-3, 4)\\)?", answer: "Quadrant II.", solution: "Negative \\(x\\), positive \\(y\\)." },
          { type: "regular", q: "Slope through \\((2, 5)\\) and \\((6, 13)\\)?", answer: "2.", solution: "\\((13-5)/(6-2)\\)." },
          { type: "regular", q: "y-intercept of \\(y = -3x + 7\\)?", answer: "7.", solution: "Set \\(x = 0\\)." },
          { type: "regular", q: "Is \\((1, 4)\\) a solution to \\(y = 4x\\)?", answer: "Yes.", solution: "\\(4(1) = 4\\)." },
          { type: "word", q: "A hill rises 10 ft over 50 ft. Slope?", answer: "\\(\\dfrac{1}{5}\\).", solution: "\\(10/50\\)." },
          { type: "word", q: "x-intercept of \\(3x + 2y = 12\\)?", answer: "\\(x = 4\\).", solution: "Set \\(y = 0\\)." }
        ]
      }
    }
  ]
};
