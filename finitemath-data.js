// Finite Mathematics course — applied math for business/economics.
const FINITEMATH_COURSE = {
  id: "finitemath",
  title: "Finite Mathematics",
  subtitle: "Sets, matrices, linear programming, finance",
  emoji: "🧮",
  accent: "#5d7a9c",
  accent2: "#a8b9cf",
  description: "Five chapters covering sets and logic, counting, matrices, linear programming, and financial math.",
  books: [
    {
      id: "fm1", num: 1, title: "Sets & Logic", subtitle: "Operations, truth tables, statements",
      emoji: "🔣", accent: "#5d7a9c", accent2: "#a8b9cf",
      sections: [
        {
          title: "Set Operations",
          questions: [
            { type: "regular", q: "\\(\\{1,2,3\\} \\cup \\{3,4\\}\\)?", answer: "\\(\\{1,2,3,4\\}\\).", solution: "Union: all elements." },
            { type: "regular", q: "\\(\\{1,2,3\\} \\cap \\{2,3,4\\}\\)?", answer: "\\(\\{2,3\\}\\).", solution: "Intersection: common elements." },
            { type: "regular", q: "\\(\\{1,2,3,4\\} \\setminus \\{2,4\\}\\)?", answer: "\\(\\{1,3\\}\\).", solution: "Difference." },
            { type: "regular", q: "Cardinality of \\(\\{a,b,c,d\\}\\)?", answer: "4.", solution: "Number of elements." },
            { type: "word", q: "Subsets of \\(\\{a,b\\}\\)?", answer: "\\(\\{\\}, \\{a\\}, \\{b\\}, \\{a,b\\}\\).", solution: "\\(2^2 = 4\\) subsets." }
          ]
        },
        {
          title: "Truth Tables",
          questions: [
            { type: "regular", q: "T AND F = ?", answer: "F.", solution: "AND needs both true." },
            { type: "regular", q: "T OR F = ?", answer: "T.", solution: "OR needs at least one." },
            { type: "regular", q: "NOT T = ?", answer: "F.", solution: "Negation." },
            { type: "regular", q: "T → F = ?", answer: "F.", solution: "Conditional false only here." },
            { type: "word", q: "Truth table for AND has how many rows for 2 variables?", answer: "4.", solution: "\\(2^2\\)." }
          ]
        },
        {
          title: "Logical Statements & Inference",
          questions: [
            { type: "regular", q: "Contrapositive of \"If P then Q\"?", answer: "If not Q then not P.", solution: "Logically equivalent." },
            { type: "regular", q: "Converse of \"If P then Q\"?", answer: "If Q then P.", solution: "Not equivalent." },
            { type: "regular", q: "P AND (NOT P) is?", answer: "Always F (contradiction).", solution: "Cannot both hold." },
            { type: "regular", q: "P OR (NOT P) is?", answer: "Always T (tautology).", solution: "One must hold." },
            { type: "word", q: "If \"rain → wet\" and it rained, then?", answer: "Wet.", solution: "Modus ponens." }
          ]
        }
      ],
      cumulativeTest: {
        title: "Cumulative Test — Sets & Logic",
        questions: [
          { type: "regular", q: "\\(\\{1,2\\} \\cup \\{2,3\\}\\)?", answer: "\\(\\{1,2,3\\}\\).", solution: "Union." },
          { type: "regular", q: "\\(\\{1,2,3\\} \\cap \\{2,4\\}\\)?", answer: "\\(\\{2\\}\\).", solution: "Intersection." },
          { type: "regular", q: "T AND T = ?", answer: "T.", solution: "Both true." },
          { type: "regular", q: "Contrapositive of \"If P then Q\"?", answer: "If not Q then not P.", solution: "Standard." },
          { type: "word", q: "Subsets of \\(\\{x\\}\\)?", answer: "\\(\\{\\}, \\{x\\}\\).", solution: "2 subsets." },
          { type: "word", q: "Number of subsets of a 3-element set?", answer: "8.", solution: "\\(2^3\\)." }
        ]
      }
    },
    {
      id: "fm2", num: 2, title: "Counting & Combinatorics", subtitle: "Permutations and combinations",
      emoji: "🔢", accent: "#9b59b6", accent2: "#48dbfb",
      sections: [
        {
          title: "Multiplication Principle",
          questions: [
            { type: "regular", q: "3 shirts, 4 pants. Outfits?", answer: "12.", solution: "\\(3 \\cdot 4\\)." },
            { type: "regular", q: "2-letter passwords from {a, b, c}?", answer: "9.", solution: "\\(3 \\cdot 3\\)." },
            { type: "regular", q: "Coin flipped 5 times. Possible sequences?", answer: "32.", solution: "\\(2^5\\)." },
            { type: "regular", q: "License plate: 3 letters + 4 digits. Total?", answer: "\\(26^3 \\cdot 10^4 = 175{,}760{,}000\\).", solution: "Multiplication principle." },
            { type: "word", q: "Menu: 4 appetizers, 5 entrées, 3 desserts. Meals?", answer: "60.", solution: "\\(4 \\cdot 5 \\cdot 3\\)." }
          ]
        },
        {
          title: "Permutations",
          questions: [
            { type: "regular", q: "P(5,2)?", answer: "20.", solution: "\\(5!/3! = 20\\)." },
            { type: "regular", q: "Permutations of 5 distinct items?", answer: "120.", solution: "\\(5!\\)." },
            { type: "regular", q: "P(6,3)?", answer: "120.", solution: "\\(6 \\cdot 5 \\cdot 4\\)." },
            { type: "regular", q: "How many ways to arrange ABCD?", answer: "24.", solution: "\\(4! = 24\\)." },
            { type: "word", q: "Top 3 places from 8 racers (order matters)?", answer: "336.", solution: "\\(P(8,3) = 8 \\cdot 7 \\cdot 6\\)." }
          ]
        },
        {
          title: "Combinations",
          questions: [
            { type: "regular", q: "C(5,2)?", answer: "10.", solution: "\\(\\binom{5}{2}\\)." },
            { type: "regular", q: "C(7,3)?", answer: "35.", solution: "\\(\\binom{7}{3} = 35\\)." },
            { type: "regular", q: "C(n,n)?", answer: "1.", solution: "One way to choose all." },
            { type: "regular", q: "C(10,2)?", answer: "45.", solution: "\\(\\binom{10}{2}\\)." },
            { type: "word", q: "Choose 2 from 6 friends to bring along?", answer: "15.", solution: "\\(\\binom{6}{2}\\)." }
          ]
        }
      ],
      cumulativeTest: {
        title: "Cumulative Test — Counting",
        questions: [
          { type: "regular", q: "5 shirts × 3 pants?", answer: "15.", solution: "Multiplication." },
          { type: "regular", q: "P(6, 2)?", answer: "30.", solution: "\\(6 \\cdot 5\\)." },
          { type: "regular", q: "C(8, 2)?", answer: "28.", solution: "\\(\\binom{8}{2}\\)." },
          { type: "regular", q: "Arrangements of ABCDE?", answer: "120.", solution: "\\(5!\\)." },
          { type: "word", q: "How many 3-letter words from {A,B,C} without repeats?", answer: "6.", solution: "\\(3!\\)." },
          { type: "word", q: "Choose 5-card hand from 52?", answer: "C(52,5) = 2,598,960.", solution: "Standard." }
        ]
      }
    },
    {
      id: "fm3", num: 3, title: "Matrices & Linear Systems", subtitle: "Solving with matrices",
      emoji: "📦", accent: "#10ac84", accent2: "#feca57",
      sections: [
        {
          title: "Matrix Operations",
          questions: [
            { type: "regular", q: "Size of a matrix with 2 rows and 3 cols?", answer: "2×3.", solution: "rows × cols." },
            { type: "regular", q: "\\(\\begin{pmatrix}1&2\\\\3&4\\end{pmatrix} + \\begin{pmatrix}5&0\\\\1&2\\end{pmatrix}\\)?", answer: "\\(\\begin{pmatrix}6&2\\\\4&6\\end{pmatrix}\\).", solution: "Add entries." },
            { type: "regular", q: "Scalar: \\(3 \\cdot \\begin{pmatrix}1&2\\\\3&4\\end{pmatrix}\\)?", answer: "\\(\\begin{pmatrix}3&6\\\\9&12\\end{pmatrix}\\).", solution: "Multiply each entry." },
            { type: "regular", q: "When can you multiply A (m×n) by B (p×q)?", answer: "When n = p.", solution: "Inner dimensions match." },
            { type: "word", q: "Result size when 2×3 multiplied by 3×4?", answer: "2×4.", solution: "Outer dimensions." }
          ]
        },
        {
          title: "Gaussian Elimination",
          questions: [
            { type: "regular", q: "Goal of row reduction?", answer: "Row echelon form / reduced row echelon.", solution: "Standard." },
            { type: "regular", q: "Allowed row operations? (name one)", answer: "Swap rows / multiply row by constant / add multiple of row to another.", solution: "Three elementary operations." },
            { type: "regular", q: "Row echelon form requires?", answer: "Leading 1s, zeros below; staircase pattern.", solution: "Standard." },
            { type: "regular", q: "Solve \\(x + y = 5, x - y = 1\\).", answer: "x = 3, y = 2.", solution: "Add equations: 2x = 6." },
            { type: "word", q: "Augmented matrix for \\(2x+y=7, x-y=2\\)?", answer: "\\(\\left[\\begin{matrix}2&1&|&7\\\\1&-1&|&2\\end{matrix}\\right]\\).", solution: "Standard." }
          ]
        },
        {
          title: "Matrix Inverses",
          questions: [
            { type: "regular", q: "Identity matrix \\(I_2\\)?", answer: "\\(\\begin{pmatrix}1&0\\\\0&1\\end{pmatrix}\\).", solution: "1s on diagonal." },
            { type: "regular", q: "\\(AA^{-1} = ?\\)", answer: "\\(I\\).", solution: "Definition of inverse." },
            { type: "regular", q: "Determinant of \\(\\begin{pmatrix}a&b\\\\c&d\\end{pmatrix}\\)?", answer: "\\(ad - bc\\).", solution: "Standard 2×2." },
            { type: "regular", q: "Det = 0 means?", answer: "No inverse (singular).", solution: "Standard." },
            { type: "word", q: "Solve AX = B by?", answer: "X = A⁻¹B.", solution: "Multiply by inverse." }
          ]
        }
      ],
      cumulativeTest: {
        title: "Cumulative Test — Matrices",
        questions: [
          { type: "regular", q: "Size of \\(\\begin{pmatrix}1&2&3\\\\4&5&6\\end{pmatrix}\\)?", answer: "2×3.", solution: "Standard." },
          { type: "regular", q: "Det of \\(\\begin{pmatrix}1&2\\\\3&4\\end{pmatrix}\\)?", answer: "−2.", solution: "ad − bc." },
          { type: "regular", q: "When can A (2×3) multiply B (3×2)?", answer: "Yes; result 2×2.", solution: "Inner match." },
          { type: "regular", q: "I_3 has how many ones?", answer: "3.", solution: "Diagonal." },
          { type: "word", q: "Solve x+y=4, x−y=2.", answer: "x=3, y=1.", solution: "Add equations." },
          { type: "word", q: "Det 0 implies?", answer: "Singular (no inverse).", solution: "Standard." }
        ]
      }
    },
    {
      id: "fm4", num: 4, title: "Linear Programming", subtitle: "Optimization with constraints",
      emoji: "📊", accent: "#0abde3", accent2: "#54a0ff",
      sections: [
        {
          title: "Linear Inequalities & Feasible Region",
          questions: [
            { type: "regular", q: "Graph of \\(x + y \\le 4\\) (in QI)?", answer: "Triangle below line.", solution: "Half-plane." },
            { type: "regular", q: "Is (1, 1) in \\(2x + y \\le 5\\)?", answer: "Yes.", solution: "\\(2 + 1 \\le 5\\)." },
            { type: "regular", q: "Feasible region for \\(x \\ge 0, y \\ge 0, x + y \\le 3\\)?", answer: "Triangle with vertices (0,0), (3,0), (0,3).", solution: "Standard." },
            { type: "regular", q: "Bounded vs. unbounded feasible region?", answer: "Bounded fits in a finite area.", solution: "Standard." },
            { type: "word", q: "Why nonnegative constraints in LP?", answer: "Quantities can't be negative.", solution: "Real-world." }
          ]
        },
        {
          title: "Objective Functions & Corner Points",
          questions: [
            { type: "regular", q: "Where does an LP optimum occur?", answer: "At a vertex (corner).", solution: "Fundamental theorem of LP." },
            { type: "regular", q: "Maximize z = x + 2y at vertices (0,0), (3,0), (0,3)?", answer: "z = 6 at (0,3).", solution: "Check vertices." },
            { type: "regular", q: "Why corner points?", answer: "Linear objective; max on boundary.", solution: "LP theorem." },
            { type: "regular", q: "Multiple optima?", answer: "Whole edge can be optimal.", solution: "Tie." },
            { type: "word", q: "Maximize z = 3x + 4y at (2,1)?", answer: "10.", solution: "Plug in." }
          ]
        },
        {
          title: "Applications: Production & Mix",
          questions: [
            { type: "regular", q: "LP variables represent?", answer: "Quantities (units, hours, etc.).", solution: "Decision variables." },
            { type: "regular", q: "Constraints represent?", answer: "Resource limits.", solution: "Standard." },
            { type: "regular", q: "Why find corner with highest z?", answer: "It's the optimal.", solution: "Standard." },
            { type: "regular", q: "If feasible region empty?", answer: "No solution (infeasible).", solution: "Constraints contradict." },
            { type: "word", q: "Make x widgets at $2 profit, y at $3, with total ≤ 10 units. Max profit?", answer: "$30 at (0,10).", solution: "All y." }
          ]
        }
      ],
      cumulativeTest: {
        title: "Cumulative Test — Linear Programming",
        questions: [
          { type: "regular", q: "Optimum location in LP?", answer: "Vertex.", solution: "Fundamental theorem." },
          { type: "regular", q: "Is (2,3) in \\(x + y \\le 4\\)?", answer: "No.", solution: "5 > 4." },
          { type: "regular", q: "Max z = 2x + y at (3,0)?", answer: "6.", solution: "Plug in." },
          { type: "regular", q: "Empty feasible region?", answer: "Infeasible.", solution: "No solution." },
          { type: "word", q: "Why nonnegative constraints?", answer: "Quantities can't be negative.", solution: "Real world." },
          { type: "word", q: "Max profit at vertex (4,2) with z = x + 3y?", answer: "10.", solution: "Plug in." }
        ]
      }
    },
    {
      id: "fm5", num: 5, title: "Financial Math", subtitle: "Interest, annuities, loans",
      emoji: "💰", accent: "#ff9f43", accent2: "#feca57",
      sections: [
        {
          title: "Simple & Compound Interest",
          questions: [
            { type: "regular", q: "Simple interest: $1000 at 5% for 2 years?", answer: "$100.", solution: "\\(I = Prt\\)." },
            { type: "regular", q: "Compound formula?", answer: "\\(A = P(1+r/n)^{nt}\\).", solution: "Standard." },
            { type: "regular", q: "$1000 at 4% annual, compounded yearly, 3 years?", answer: "\\(\\approx \\$1124.86\\).", solution: "\\(1000(1.04)^3\\)." },
            { type: "regular", q: "Continuous compound formula?", answer: "\\(A = Pe^{rt}\\).", solution: "Standard." },
            { type: "word", q: "Simple interest: $500 at 6% for 4 years?", answer: "$120.", solution: "\\(Prt\\)." }
          ]
        },
        {
          title: "Annuities & Future Value",
          questions: [
            { type: "regular", q: "Annuity: equal payments over time. T/F?", answer: "True.", solution: "Definition." },
            { type: "regular", q: "FV of ordinary annuity formula?", answer: "\\(FV = PMT \\cdot \\dfrac{(1+r)^n - 1}{r}\\).", solution: "Standard." },
            { type: "regular", q: "Higher rate → FV?", answer: "Larger.", solution: "Earns more." },
            { type: "regular", q: "Saving $100/month at 6% annual for 12 months: roughly?", answer: "≈ $1233.", solution: "FV of annuity." },
            { type: "word", q: "Why does annuity FV exceed sum of payments?", answer: "Earlier payments earn interest.", solution: "Time value." }
          ]
        },
        {
          title: "Loans & Present Value",
          questions: [
            { type: "regular", q: "PV formula for single sum?", answer: "\\(PV = FV/(1+r)^n\\).", solution: "Discount back." },
            { type: "regular", q: "Loan payment formula component name?", answer: "Amortization.", solution: "Standard." },
            { type: "regular", q: "$1000 in 2 years at 5%. PV?", answer: "≈ $907.03.", solution: "\\(1000/1.05^2\\)." },
            { type: "regular", q: "Higher discount rate → PV?", answer: "Smaller.", solution: "More discounting." },
            { type: "word", q: "Why is $1 today > $1 next year?", answer: "Can earn interest.", solution: "Time value of money." }
          ]
        }
      ],
      cumulativeTest: {
        title: "Cumulative Test — Financial Math",
        questions: [
          { type: "regular", q: "Simple interest formula?", answer: "\\(I = Prt\\).", solution: "Standard." },
          { type: "regular", q: "Compound interest formula?", answer: "\\(A = P(1+r/n)^{nt}\\).", solution: "Standard." },
          { type: "regular", q: "PV: $1000 in 1 year at 10%?", answer: "$909.09.", solution: "1000/1.10." },
          { type: "regular", q: "Continuous compounding formula?", answer: "\\(A = Pe^{rt}\\).", solution: "Standard." },
          { type: "word", q: "$500 at 8% for 3 years (simple)?", answer: "$120 interest.", solution: "\\(Prt\\)." },
          { type: "word", q: "Why annuity FV > sum of deposits?", answer: "Earlier deposits earn interest.", solution: "Time value." }
        ]
      }
    }
  ]
};
