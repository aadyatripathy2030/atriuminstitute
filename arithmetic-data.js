// Arithmetic course — foundational math (elementary / middle school).
const ARITHMETIC_COURSE = {
  id: "arithmetic",
  title: "Arithmetic",
  subtitle: "Whole numbers, fractions, decimals, percents",
  emoji: "🔢",
  accent: "#4a6fa5",
  accent2: "#7c94c2",
  description: "Five chapters covering the foundations of all later math — operations on whole numbers, fractions, decimals, percents, and integers.",
  books: [
    {
      id: "ar1", num: 1, title: "Whole Numbers", subtitle: "Place value, the four operations",
      emoji: "🔟", accent: "#4a6fa5", accent2: "#7c94c2",
      sections: [
        {
          title: "Place Value & Naming",
          questions: [
            { type: "regular", q: "What is the place value of the 6 in 36,482?", answer: "Thousands.", solution: "Reading right to left: ones, tens, hundreds, thousands — 6 is in thousands." },
            { type: "regular", q: "Write 4,073 in words.", answer: "Four thousand, seventy-three.", solution: "Name each period; the hundreds slot is empty." },
            { type: "regular", q: "Write \"five thousand, twelve\" in digits.", answer: "5,012.", solution: "5 thousand, 0 hundreds, 1 ten, 2 ones." },
            { type: "regular", q: "What is the value of the digit 8 in 285,000?", answer: "80,000.", solution: "8 is in the ten-thousands place." },
            { type: "word", q: "A stadium seats 27,841 fans. Write that in words.", answer: "Twenty-seven thousand, eight hundred forty-one.", solution: "Name each period." }
          ]
        },
        {
          title: "Adding & Subtracting",
          questions: [
            { type: "regular", q: "\\(456 + 287\\)?", answer: "743.", solution: "Stack and add with carries." },
            { type: "regular", q: "\\(800 - 235\\)?", answer: "565.", solution: "Subtract with borrowing." },
            { type: "regular", q: "\\(1,204 + 3,791\\)?", answer: "4,995.", solution: "Add column by column." },
            { type: "regular", q: "\\(5,000 - 1,847\\)?", answer: "3,153.", solution: "Borrow across the zeros." },
            { type: "word", q: "A bakery sells 218 loaves on Monday and 195 on Tuesday. Total?", answer: "413 loaves.", solution: "\\(218 + 195\\)." }
          ]
        },
        {
          title: "Multiplying & Dividing",
          questions: [
            { type: "regular", q: "\\(24 \\times 13\\)?", answer: "312.", solution: "\\(24(10) + 24(3) = 240 + 72\\)." },
            { type: "regular", q: "\\(126 \\div 6\\)?", answer: "21.", solution: "\\(6 \\cdot 21 = 126\\)." },
            { type: "regular", q: "\\(45 \\times 100\\)?", answer: "4,500.", solution: "Add two zeros." },
            { type: "regular", q: "\\(248 \\div 8\\)?", answer: "31.", solution: "\\(8 \\cdot 31 = 248\\)." },
            { type: "word", q: "A box has 24 packs of 12 markers each. Total markers?", answer: "288.", solution: "\\(24 \\cdot 12\\)." }
          ]
        }
      ],
      cumulativeTest: {
        title: "Cumulative Test — Whole Numbers",
        questions: [
          { type: "regular", q: "Place value of the 7 in 73,205?", answer: "Ten-thousands.", solution: "Counting right to left." },
          { type: "regular", q: "\\(382 + 459\\)?", answer: "841.", solution: "Stack and add." },
          { type: "regular", q: "\\(900 - 358\\)?", answer: "542.", solution: "Subtract with borrowing." },
          { type: "regular", q: "\\(17 \\times 11\\)?", answer: "187.", solution: "\\(17(10) + 17\\)." },
          { type: "word", q: "A classroom has 28 desks in 6 rows. Total seats?", answer: "168.", solution: "\\(28 \\cdot 6\\)." },
          { type: "word", q: "A book has 480 pages; you've read 195. Pages left?", answer: "285.", solution: "\\(480 - 195\\)." }
        ]
      }
    },
    {
      id: "ar2", num: 2, title: "Fractions", subtitle: "Equivalent, operations, mixed numbers",
      emoji: "🍕", accent: "#a05d5d", accent2: "#c89595",
      sections: [
        {
          title: "Equivalent Fractions & Simplifying",
          questions: [
            { type: "regular", q: "Simplify \\(\\dfrac{12}{18}\\).", answer: "\\(\\dfrac{2}{3}\\).", solution: "Divide top and bottom by GCF 6." },
            { type: "regular", q: "Is \\(\\dfrac{4}{6}\\) equivalent to \\(\\dfrac{2}{3}\\)?", answer: "Yes.", solution: "Both simplify to \\(\\dfrac{2}{3}\\)." },
            { type: "regular", q: "Write \\(\\dfrac{1}{4}\\) with denominator 12.", answer: "\\(\\dfrac{3}{12}\\).", solution: "Multiply top and bottom by 3." },
            { type: "regular", q: "Simplify \\(\\dfrac{20}{25}\\).", answer: "\\(\\dfrac{4}{5}\\).", solution: "Divide by GCF 5." },
            { type: "word", q: "Out of 24 cookies, 16 are chocolate. What fraction?", answer: "\\(\\dfrac{2}{3}\\).", solution: "\\(\\dfrac{16}{24}\\) simplifies." }
          ]
        },
        {
          title: "Adding & Subtracting Fractions",
          questions: [
            { type: "regular", q: "\\(\\dfrac{1}{4} + \\dfrac{2}{4}\\)?", answer: "\\(\\dfrac{3}{4}\\).", solution: "Same denominator." },
            { type: "regular", q: "\\(\\dfrac{1}{3} + \\dfrac{1}{6}\\)?", answer: "\\(\\dfrac{1}{2}\\).", solution: "LCD 6: \\(\\dfrac{2}{6} + \\dfrac{1}{6}\\)." },
            { type: "regular", q: "\\(\\dfrac{5}{8} - \\dfrac{1}{4}\\)?", answer: "\\(\\dfrac{3}{8}\\).", solution: "\\(\\dfrac{5}{8} - \\dfrac{2}{8}\\)." },
            { type: "regular", q: "\\(2\\dfrac{1}{2} + 1\\dfrac{1}{4}\\)?", answer: "\\(3\\dfrac{3}{4}\\).", solution: "Add wholes, then fractions." },
            { type: "word", q: "You walk \\(\\dfrac{1}{2}\\) mile then \\(\\dfrac{3}{4}\\) mile. Total?", answer: "\\(1\\dfrac{1}{4}\\) miles.", solution: "\\(\\dfrac{2}{4} + \\dfrac{3}{4}\\)." }
          ]
        },
        {
          title: "Multiplying & Dividing Fractions",
          questions: [
            { type: "regular", q: "\\(\\dfrac{2}{3} \\cdot \\dfrac{3}{4}\\)?", answer: "\\(\\dfrac{1}{2}\\).", solution: "\\(\\dfrac{6}{12}\\) simplifies." },
            { type: "regular", q: "\\(\\dfrac{3}{4} \\div \\dfrac{1}{2}\\)?", answer: "\\(\\dfrac{3}{2}\\).", solution: "Multiply by reciprocal." },
            { type: "regular", q: "\\(\\dfrac{1}{2} \\cdot 8\\)?", answer: "4.", solution: "Half of 8." },
            { type: "regular", q: "\\(5 \\div \\dfrac{1}{3}\\)?", answer: "15.", solution: "Multiply by 3." },
            { type: "word", q: "A recipe needs \\(\\dfrac{3}{4}\\) cup of flour. You triple it. Total flour?", answer: "\\(2\\dfrac{1}{4}\\) cups.", solution: "\\(\\dfrac{3}{4} \\cdot 3 = \\dfrac{9}{4}\\)." }
          ]
        }
      ],
      cumulativeTest: {
        title: "Cumulative Test — Fractions",
        questions: [
          { type: "regular", q: "Simplify \\(\\dfrac{15}{25}\\).", answer: "\\(\\dfrac{3}{5}\\).", solution: "Divide by 5." },
          { type: "regular", q: "\\(\\dfrac{1}{2} + \\dfrac{1}{3}\\)?", answer: "\\(\\dfrac{5}{6}\\).", solution: "LCD 6." },
          { type: "regular", q: "\\(\\dfrac{3}{8} \\cdot \\dfrac{4}{9}\\)?", answer: "\\(\\dfrac{1}{6}\\).", solution: "\\(\\dfrac{12}{72}\\) simplifies." },
          { type: "regular", q: "\\(\\dfrac{5}{6} \\div \\dfrac{1}{2}\\)?", answer: "\\(\\dfrac{5}{3}\\).", solution: "Multiply by 2." },
          { type: "word", q: "Half a pizza has 4 slices. Whole pizza?", answer: "8 slices.", solution: "\\(2 \\cdot 4\\)." },
          { type: "word", q: "A board is \\(4\\dfrac{1}{2}\\) ft; you cut off \\(1\\dfrac{1}{4}\\) ft. Left?", answer: "\\(3\\dfrac{1}{4}\\) ft.", solution: "\\(\\dfrac{9}{2} - \\dfrac{5}{4}\\)." }
        ]
      }
    },
    {
      id: "ar3", num: 3, title: "Decimals", subtitle: "Place value, operations, conversions",
      emoji: "🔢", accent: "#5a8d88", accent2: "#97b9b5",
      sections: [
        {
          title: "Decimal Place Value & Rounding",
          questions: [
            { type: "regular", q: "Place value of the 4 in 7.0042?", answer: "Thousandths.", solution: "Tenths, hundredths, thousandths." },
            { type: "regular", q: "Round 3.476 to the nearest tenth.", answer: "3.5.", solution: "Hundredths 7 ≥ 5." },
            { type: "regular", q: "Which is larger: 0.45 or 0.5?", answer: "0.5.", solution: "0.50 > 0.45." },
            { type: "regular", q: "Round 12.348 to the nearest hundredth.", answer: "12.35.", solution: "Thousandths 8 ≥ 5." },
            { type: "word", q: "A coin weighs 5.073 grams. Round to the nearest hundredth.", answer: "5.07 g.", solution: "Thousandths 3 < 5." }
          ]
        },
        {
          title: "Decimal Operations",
          questions: [
            { type: "regular", q: "\\(2.5 + 1.85\\)?", answer: "4.35.", solution: "Line up decimals; add." },
            { type: "regular", q: "\\(7.2 - 3.46\\)?", answer: "3.74.", solution: "Subtract with borrowing." },
            { type: "regular", q: "\\(0.4 \\cdot 0.5\\)?", answer: "0.20.", solution: "Multiply: 20; two decimal places." },
            { type: "regular", q: "\\(12.6 \\div 0.6\\)?", answer: "21.", solution: "Shift decimals: \\(126 \\div 6\\)." },
            { type: "word", q: "A sandwich is $5.75; a drink is $2.25. Total?", answer: "$8.00.", solution: "Add." }
          ]
        },
        {
          title: "Fraction & Decimal Conversions",
          questions: [
            { type: "regular", q: "Convert \\(\\dfrac{1}{4}\\) to a decimal.", answer: "0.25.", solution: "\\(1 \\div 4\\)." },
            { type: "regular", q: "Convert 0.6 to a fraction in lowest terms.", answer: "\\(\\dfrac{3}{5}\\).", solution: "\\(\\dfrac{6}{10}\\) simplifies." },
            { type: "regular", q: "Convert \\(\\dfrac{3}{8}\\) to a decimal.", answer: "0.375.", solution: "\\(3 \\div 8\\)." },
            { type: "regular", q: "Convert 0.125 to a fraction.", answer: "\\(\\dfrac{1}{8}\\).", solution: "\\(\\dfrac{125}{1000}\\) simplifies." },
            { type: "word", q: "Convert \\(\\dfrac{7}{10}\\) to a decimal.", answer: "0.7.", solution: "Tenths." }
          ]
        }
      ],
      cumulativeTest: {
        title: "Cumulative Test — Decimals",
        questions: [
          { type: "regular", q: "Round 6.249 to the nearest tenth.", answer: "6.2.", solution: "Hundredths 4 < 5." },
          { type: "regular", q: "\\(3.4 + 5.71\\)?", answer: "9.11.", solution: "Line up decimals." },
          { type: "regular", q: "\\(0.3 \\cdot 0.7\\)?", answer: "0.21.", solution: "Multiply: 21." },
          { type: "regular", q: "Convert \\(\\dfrac{1}{2}\\) to a decimal.", answer: "0.5.", solution: "Half." },
          { type: "word", q: "Convert 0.4 to a fraction.", answer: "\\(\\dfrac{2}{5}\\).", solution: "\\(\\dfrac{4}{10}\\)." },
          { type: "word", q: "A receipt shows 3 items at $2.49 each. Total?", answer: "$7.47.", solution: "\\(3 \\cdot 2.49\\)." }
        ]
      }
    },
    {
      id: "ar4", num: 4, title: "Percents", subtitle: "Conversions, percent of, applications",
      emoji: "💯", accent: "#56a56b", accent2: "#8fc79f",
      sections: [
        {
          title: "Percent Conversions",
          questions: [
            { type: "regular", q: "Convert 0.35 to a percent.", answer: "35%.", solution: "Multiply by 100." },
            { type: "regular", q: "Convert 60% to a decimal.", answer: "0.60.", solution: "Divide by 100." },
            { type: "regular", q: "Convert \\(\\dfrac{1}{4}\\) to a percent.", answer: "25%.", solution: "\\(0.25 \\cdot 100\\)." },
            { type: "regular", q: "Convert 150% to a decimal.", answer: "1.5.", solution: "Divide by 100." },
            { type: "word", q: "A test score of 0.92 is what percent?", answer: "92%.", solution: "Shift decimal." }
          ]
        },
        {
          title: "Finding the Percent of a Number",
          questions: [
            { type: "regular", q: "20% of 50?", answer: "10.", solution: "\\(0.2 \\cdot 50\\)." },
            { type: "regular", q: "15% of 80?", answer: "12.", solution: "\\(0.15 \\cdot 80\\)." },
            { type: "regular", q: "9 is what percent of 36?", answer: "25%.", solution: "\\(9/36\\)." },
            { type: "regular", q: "50% of what number is 14?", answer: "28.", solution: "\\(14/0.5\\)." },
            { type: "word", q: "A class of 25 has 60% girls. How many girls?", answer: "15.", solution: "\\(0.6 \\cdot 25\\)." }
          ]
        },
        {
          title: "Percent Applications (Tax, Tip, Discount)",
          questions: [
            { type: "regular", q: "A $40 shirt is 25% off. Sale price?", answer: "$30.", solution: "\\(40 - 0.25(40)\\)." },
            { type: "regular", q: "8% tax on $50?", answer: "$4.", solution: "\\(0.08 \\cdot 50\\)." },
            { type: "regular", q: "20% tip on a $35 bill?", answer: "$7.", solution: "\\(0.2 \\cdot 35\\)." },
            { type: "regular", q: "Simple interest: $200 at 5% for 2 years?", answer: "$20.", solution: "\\(I = Prt\\)." },
            { type: "word", q: "A $80 jacket is 30% off, then 10% tax. Final price?", answer: "$61.60.", solution: "\\(80(0.7)(1.1)\\)." }
          ]
        }
      ],
      cumulativeTest: {
        title: "Cumulative Test — Percents",
        questions: [
          { type: "regular", q: "Convert 0.07 to a percent.", answer: "7%.", solution: "Shift decimal." },
          { type: "regular", q: "30% of 90?", answer: "27.", solution: "\\(0.3 \\cdot 90\\)." },
          { type: "regular", q: "12 is what percent of 48?", answer: "25%.", solution: "\\(12/48\\)." },
          { type: "regular", q: "Convert \\(\\dfrac{3}{5}\\) to a percent.", answer: "60%.", solution: "\\(0.6 \\cdot 100\\)." },
          { type: "word", q: "A $25 book is 20% off. Sale price?", answer: "$20.", solution: "\\(25(0.8)\\)." },
          { type: "word", q: "15% tip on a $40 bill?", answer: "$6.", solution: "\\(0.15 \\cdot 40\\)." }
        ]
      }
    },
    {
      id: "ar5", num: 5, title: "Integers (Negative Numbers)", subtitle: "Number line and operations",
      emoji: "➖", accent: "#566fb0", accent2: "#97a7d3",
      sections: [
        {
          title: "Integers on a Number Line",
          questions: [
            { type: "regular", q: "Which is greater: \\(-5\\) or \\(-2\\)?", answer: "\\(-2\\).", solution: "\\(-2\\) is to the right on the number line." },
            { type: "regular", q: "What is the opposite of \\(7\\)?", answer: "\\(-7\\).", solution: "Same distance from 0, opposite sign." },
            { type: "regular", q: "What is \\(|-9|\\)?", answer: "9.", solution: "Absolute value is distance from 0." },
            { type: "regular", q: "Order least to greatest: \\(-3, 0, -5, 2\\).", answer: "\\(-5, -3, 0, 2\\).", solution: "More negative = smaller." },
            { type: "word", q: "Temperature drops from 5°F to \\(-3°F\\). Change?", answer: "\\(-8°F\\) (dropped 8 degrees).", solution: "\\(-3 - 5\\)." }
          ]
        },
        {
          title: "Adding & Subtracting Integers",
          questions: [
            { type: "regular", q: "\\(-7 + 3\\)?", answer: "\\(-4\\).", solution: "Different signs: subtract; keep sign of larger." },
            { type: "regular", q: "\\(-5 + (-8)\\)?", answer: "\\(-13\\).", solution: "Same signs: add, keep sign." },
            { type: "regular", q: "\\(4 - 9\\)?", answer: "\\(-5\\).", solution: "\\(4 + (-9)\\)." },
            { type: "regular", q: "\\(-6 - (-2)\\)?", answer: "\\(-4\\).", solution: "\\(-6 + 2\\)." },
            { type: "word", q: "You owe $15 and pay back $9. Balance?", answer: "\\(-\\$6\\).", solution: "\\(-15 + 9\\)." }
          ]
        },
        {
          title: "Multiplying & Dividing Integers",
          questions: [
            { type: "regular", q: "\\((-4)(3)\\)?", answer: "\\(-12\\).", solution: "Different signs → negative." },
            { type: "regular", q: "\\((-5)(-6)\\)?", answer: "30.", solution: "Same signs → positive." },
            { type: "regular", q: "\\(-24 \\div 6\\)?", answer: "\\(-4\\).", solution: "Different signs → negative." },
            { type: "regular", q: "\\(\\dfrac{-36}{-9}\\)?", answer: "4.", solution: "Same signs → positive." },
            { type: "word", q: "A scuba diver descends 8 ft per minute for 5 minutes. Position?", answer: "\\(-40\\) ft.", solution: "\\(5 \\cdot (-8)\\)." }
          ]
        }
      ],
      cumulativeTest: {
        title: "Cumulative Test — Integers",
        questions: [
          { type: "regular", q: "\\(-8 + 5\\)?", answer: "\\(-3\\).", solution: "Different signs." },
          { type: "regular", q: "\\(-4 - (-7)\\)?", answer: "3.", solution: "\\(-4 + 7\\)." },
          { type: "regular", q: "\\((-3)(8)\\)?", answer: "\\(-24\\).", solution: "Different signs." },
          { type: "regular", q: "\\(-45 \\div -5\\)?", answer: "9.", solution: "Same signs." },
          { type: "word", q: "Opposite of \\(-12\\)?", answer: "12.", solution: "Negate." },
          { type: "word", q: "A bird flies up 20 ft from \\(-5\\) ft elevation. New elevation?", answer: "15 ft.", solution: "\\(-5 + 20\\)." }
        ]
      }
    }
  ]
};
