// Algebra course data - 6 books, sections, and sample questions (regular + word problems).
// Questions use LaTeX via MathJax: inline with \( \) and block with \[ \].
const ALGEBRA_COURSE = {
  id: "algebra",
  title: "Algebra 1",
  subtitle: "Functions, equations, and the language of change",
  emoji: "📐",
  accent: "#4a6fa5",
  accent2: "#7c94c2",
  description: "Six books covering functions, linear and quadratic equations, rational expressions, systems, and radicals.",
  books: [
    {
      id: "b1",
      num: 1,
      title: "Intro to Functions",
      subtitle: "The Function Forge",
      emoji: "🔧",
      accent: "#ff5e87",
      accent2: "#ffb86c",
      sections: [
        {
          title: "Comparing Independent and Dependent Quantities",
          questions: [
            { type: "regular", q: "In the relationship \\( y = 3x + 2 \\), identify the independent and dependent variables.", answer: "\\(x\\) is independent, \\(y\\) is dependent.", solution: "The variable you freely choose is independent (\\(x\\)). The one that reacts is dependent (\\(y\\))." },
            { type: "regular", q: "If \\( d = 60t \\) describes distance traveled, which variable depends on the other?", answer: "Distance \\(d\\) depends on time \\(t\\).", solution: "Time passes independently; distance grows because of time, so \\(d\\) is dependent." },
            { type: "word", q: "Maya earns $12 per hour babysitting. Let \\(h\\) be hours worked and \\(E\\) be earnings. Write the equation and label the variables.", answer: "\\(E = 12h\\); \\(h\\) independent, \\(E\\) dependent.", solution: "Earnings depend on hours, so \\(h\\) is independent and \\(E\\) is dependent." }
          ]
        },
        {
          title: "Representing a Function with an Equation or Graph",
          questions: [
            { type: "regular", q: "Does the equation \\( y = x^2 \\) represent a function?", answer: "Yes.", solution: "Every input \\(x\\) produces exactly one output, so it passes the vertical-line test." },
            { type: "regular", q: "The graph of \\( x = y^2 \\) — function or not?", answer: "Not a function.", solution: "For \\(x = 4\\), \\(y = 2\\) and \\(y = -2\\). One input gives two outputs — fails vertical-line test." },
            { type: "word", q: "A taxi charges $3 to start plus $2 per mile. Write cost \\(C\\) as a function of miles \\(m\\), and sketch the shape.", answer: "\\(C(m) = 3 + 2m\\); straight line starting at (0,3) rising with slope 2.", solution: "Fixed $3 is the y-intercept; $2/mi is the slope." }
          ]
        },
        {
          title: "Increasing, Decreasing, or Constant",
          questions: [
            { type: "regular", q: "On which interval is \\( f(x) = x^2 \\) decreasing?", answer: "\\((-\\infty, 0)\\).", solution: "Left of the vertex, \\(y\\) falls as \\(x\\) rises toward 0." },
            { type: "regular", q: "Is the horizontal line \\(y = 5\\) increasing, decreasing, or constant?", answer: "Constant.", solution: "Output never changes no matter \\(x\\)." },
            { type: "word", q: "A balloon rises for 3 seconds, hovers for 2, then falls for 4. Describe its height function's behavior.", answer: "Increasing on [0,3], constant on [3,5], decreasing on [5,9].", solution: "Track how height changes in each phase." }
          ]
        },
        {
          title: "Domain and Range of a Function",
          questions: [
            { type: "regular", q: "Find the domain of \\( f(x) = \\dfrac{1}{x-4} \\).", answer: "All real \\(x \\neq 4\\).", solution: "Denominator can't be 0, so exclude \\(x = 4\\)." },
            { type: "regular", q: "Find the range of \\( f(x) = x^2 + 1 \\).", answer: "\\(y \\geq 1\\).", solution: "\\(x^2 \\geq 0\\), so \\(x^2 + 1 \\geq 1\\)." },
            { type: "word", q: "A store sells between 0 and 200 shirts per day at $15 each. State the domain and range of revenue \\(R\\).", answer: "Domain: \\(0 \\leq s \\leq 200\\); Range: \\(0 \\leq R \\leq 3000\\).", solution: "\\(R = 15s\\). Plug in endpoints to get range." }
          ]
        },
        {
          title: "More Scenarios Involving Functions",
          questions: [
            { type: "regular", q: "If \\( f(x) = 2x - 5 \\), find \\( f(7) \\).", answer: "9.", solution: "\\(2(7) - 5 = 14 - 5 = 9\\)." },
            { type: "regular", q: "If \\( g(x) = x^2 - 3x \\), find \\( g(-2) \\).", answer: "10.", solution: "\\((-2)^2 - 3(-2) = 4 + 6 = 10\\)." },
            { type: "word", q: "A phone plan: $20 monthly + $0.10 per text. Find cost for 150 texts using \\(C(t) = 20 + 0.10t\\).", answer: "$35.", solution: "\\(20 + 0.10(150) = 20 + 15 = 35\\)." }
          ]
        }
      ]
    },
    {
      id: "b2",
      num: 2,
      title: "Linear Functions",
      subtitle: "The Linear Frontier",
      emoji: "📈",
      accent: "#6a82fb",
      accent2: "#fc5c7d",
      sections: [
        {
          title: "Plotting Points",
          questions: [
            { type: "regular", q: "Name the quadrant of the point \\((-3, 4)\\).", answer: "Quadrant II.", solution: "Negative \\(x\\), positive \\(y\\) lies in QII." },
            { type: "regular", q: "What is the distance from the origin to \\((6, 8)\\)?", answer: "10.", solution: "\\(\\sqrt{6^2 + 8^2} = \\sqrt{100} = 10\\)." },
            { type: "word", q: "A park is mapped with the fountain at (0,0). A bench sits 5 units east and 12 units north. How far from the fountain?", answer: "13 units.", solution: "\\(\\sqrt{25 + 144} = \\sqrt{169} = 13\\)." }
          ]
        },
        {
          title: "Slope",
          questions: [
            { type: "regular", q: "Find the slope through \\((2, 3)\\) and \\((5, 12)\\).", answer: "3.", solution: "\\(\\frac{12-3}{5-2} = \\frac{9}{3} = 3\\)." },
            { type: "regular", q: "What is the slope of a vertical line?", answer: "Undefined.", solution: "Rise over zero run — undefined." },
            { type: "word", q: "A staircase rises 18 in. for every 24 in. of run. What is its slope?", answer: "\\(\\tfrac{3}{4}\\).", solution: "\\(\\frac{18}{24} = \\frac{3}{4}\\)." }
          ]
        },
        {
          title: "Slope-Intercept Form",
          questions: [
            { type: "regular", q: "Write the line with slope \\(-2\\) and y-intercept 5.", answer: "\\(y = -2x + 5\\).", solution: "Form: \\(y = mx + b\\)." },
            { type: "regular", q: "Find the slope and y-intercept of \\( y = \\tfrac{1}{3}x - 4 \\).", answer: "Slope \\(\\tfrac{1}{3}\\), intercept \\(-4\\).", solution: "Read off \\(m\\) and \\(b\\)." },
            { type: "word", q: "A gym charges $25 join fee plus $10/month. Write \\(C\\) as a function of months \\(m\\).", answer: "\\(C = 10m + 25\\).", solution: "Join fee is intercept; monthly rate is slope." }
          ]
        },
        {
          title: "Standard Form",
          questions: [
            { type: "regular", q: "Convert \\( y = 2x - 6 \\) to standard form.", answer: "\\(2x - y = 6\\).", solution: "Move \\(2x\\) left: \\(-2x + y = -6\\), multiply by \\(-1\\)." },
            { type: "regular", q: "Find the x- and y-intercepts of \\( 3x + 4y = 12 \\).", answer: "x-int 4, y-int 3.", solution: "Set \\(y=0\\): \\(x=4\\). Set \\(x=0\\): \\(y=3\\)." },
            { type: "word", q: "A vendor sells apples at $2 and oranges at $3. They make $30 in a day. Write in standard form with \\(a\\) apples and \\(o\\) oranges.", answer: "\\(2a + 3o = 30\\).", solution: "Total revenue equation." }
          ]
        },
        {
          title: "Point-Slope Form",
          questions: [
            { type: "regular", q: "Write the line through \\((2, -1)\\) with slope 4.", answer: "\\(y + 1 = 4(x - 2)\\).", solution: "Use \\(y - y_1 = m(x - x_1)\\)." },
            { type: "regular", q: "Through \\((3, 7)\\) and \\((6, 13)\\), find the equation in point-slope form.", answer: "\\(y - 7 = 2(x - 3)\\).", solution: "Slope \\(\\frac{13-7}{6-3} = 2\\)." },
            { type: "word", q: "A candle is 8 in. at hour 2 and burns to 5 in. at hour 5. Write height \\(h\\) as a function of time \\(t\\).", answer: "\\(h - 8 = -1(t - 2)\\) or \\(h = -t + 10\\).", solution: "Slope \\(\\frac{5-8}{5-2} = -1\\)." }
          ]
        },
        {
          title: "Introduction to Trend Lines",
          questions: [
            { type: "regular", q: "A scatter plot has points that roughly go from lower-left to upper-right. Positive or negative correlation?", answer: "Positive.", solution: "Up-right trend = positive slope." },
            { type: "regular", q: "Trend line is \\( y = 1.5x + 2 \\). Predict \\(y\\) when \\(x = 10\\).", answer: "17.", solution: "\\(1.5(10) + 2 = 17\\)." },
            { type: "word", q: "Ice cream sales vs. temperature shows roughly \\( S = 4T - 100 \\). Estimate sales at \\(80°F\\).", answer: "220 sales.", solution: "\\(4(80) - 100 = 220\\)." }
          ]
        },
        {
          title: "Vertical and Horizontal Lines",
          questions: [
            { type: "regular", q: "Equation of the vertical line through \\((-3, 2)\\)?", answer: "\\(x = -3\\).", solution: "Vertical = constant \\(x\\)." },
            { type: "regular", q: "Equation of the horizontal line through \\((4, 7)\\)?", answer: "\\(y = 7\\).", solution: "Horizontal = constant \\(y\\)." },
            { type: "word", q: "A thermostat holds a room at exactly 72°F all day. Write temperature \\(T\\) as a function of time \\(t\\).", answer: "\\(T = 72\\).", solution: "Constant output = horizontal line." }
          ]
        },
        {
          title: "Linear Inequalities",
          questions: [
            { type: "regular", q: "Graph of \\( y > 2x + 1 \\): solid or dashed line, shade above or below?", answer: "Dashed, shade above.", solution: "Strict \\(>\\) = dashed; \\(y\\) greater = above." },
            { type: "regular", q: "Is \\((1, 5)\\) a solution to \\( y \\leq 3x + 2 \\)?", answer: "Yes.", solution: "\\(3(1)+2 = 5\\); \\(5 \\leq 5\\) true." },
            { type: "word", q: "A student has $40 for snacks ($2 each) and drinks ($3 each). Write the inequality for \\(s\\) snacks and \\(d\\) drinks.", answer: "\\(2s + 3d \\leq 40\\).", solution: "Total spent must not exceed budget." }
          ]
        }
      ]
    },
    {
      id: "b3",
      num: 3,
      title: "Quadratic Functions",
      subtitle: "The Quadratic Kingdom",
      emoji: "🏰",
      accent: "#a18cd1",
      accent2: "#fbc2eb",
      sections: [
        {
          title: "Introduction to Quadratic Functions",
          questions: [
            { type: "regular", q: "What is the general form of a quadratic function?", answer: "\\(f(x) = ax^2 + bx + c\\), \\(a \\neq 0\\).", solution: "Degree 2 polynomial." },
            { type: "regular", q: "Is \\(f(x) = 3x^2 - 4\\) quadratic?", answer: "Yes.", solution: "Highest power of \\(x\\) is 2." },
            { type: "word", q: "A ball's height is \\( h(t) = -16t^2 + 64t \\). What kind of function is this?", answer: "Quadratic.", solution: "Degree 2 in \\(t\\)." }
          ]
        },
        {
          title: "Factoring Review",
          questions: [
            { type: "regular", q: "Factor \\( x^2 + 7x + 12 \\).", answer: "\\((x+3)(x+4)\\).", solution: "Two numbers that multiply to 12 and add to 7." },
            { type: "regular", q: "Factor \\( x^2 - 9 \\).", answer: "\\((x-3)(x+3)\\).", solution: "Difference of squares." },
            { type: "word", q: "The area of a rectangle is \\(x^2 + 5x + 6\\). What are possible side lengths?", answer: "\\((x+2)\\) and \\((x+3)\\).", solution: "Factor the polynomial." }
          ]
        },
        {
          title: "Review: Radical Expressions",
          questions: [
            { type: "regular", q: "Simplify \\( \\sqrt{50} \\).", answer: "\\(5\\sqrt{2}\\).", solution: "\\(\\sqrt{25 \\cdot 2} = 5\\sqrt{2}\\)." },
            { type: "regular", q: "Simplify \\( \\sqrt{72} \\).", answer: "\\(6\\sqrt{2}\\).", solution: "\\(\\sqrt{36 \\cdot 2} = 6\\sqrt{2}\\)." },
            { type: "word", q: "A square has area 48 sq. ft. Find its side length in simplest radical form.", answer: "\\(4\\sqrt{3}\\) ft.", solution: "\\(\\sqrt{48} = \\sqrt{16 \\cdot 3} = 4\\sqrt{3}\\)." }
          ]
        },
        {
          title: "Imaginary Numbers",
          questions: [
            { type: "regular", q: "Simplify \\( \\sqrt{-25} \\).", answer: "\\(5i\\).", solution: "\\(\\sqrt{-1 \\cdot 25} = 5i\\)." },
            { type: "regular", q: "Compute \\( i^2 + i^4 \\).", answer: "0.", solution: "\\(i^2 = -1\\), \\(i^4 = 1\\); sum 0." },
            { type: "word", q: "Explain why \\( x^2 + 4 = 0 \\) has no real solutions but two complex ones.", answer: "Solutions are \\(\\pm 2i\\).", solution: "\\(x^2 = -4 \\Rightarrow x = \\pm\\sqrt{-4} = \\pm 2i\\)." }
          ]
        },
        {
          title: "Quadratic Equations",
          questions: [
            { type: "regular", q: "Solve \\( x^2 - 5x + 6 = 0 \\) by factoring.", answer: "\\(x = 2, 3\\).", solution: "\\((x-2)(x-3) = 0\\)." },
            { type: "regular", q: "Solve \\( x^2 = 49 \\).", answer: "\\(x = \\pm 7\\).", solution: "Take square root of both sides." },
            { type: "word", q: "A number squared minus twice the number equals 15. Find the number.", answer: "\\(x = 5\\) or \\(x = -3\\).", solution: "\\(x^2 - 2x - 15 = 0 \\Rightarrow (x-5)(x+3) = 0\\)." }
          ]
        },
        {
          title: "Completing the Square",
          questions: [
            { type: "regular", q: "Complete the square: \\( x^2 + 6x \\).", answer: "\\((x+3)^2 - 9\\).", solution: "Add and subtract \\((6/2)^2 = 9\\)." },
            { type: "regular", q: "Solve \\( x^2 + 4x - 5 = 0 \\) by completing the square.", answer: "\\(x = 1\\) or \\(x = -5\\).", solution: "\\((x+2)^2 = 9 \\Rightarrow x+2 = \\pm 3\\)." },
            { type: "word", q: "Rewrite \\( h(t) = t^2 - 8t + 20 \\) in vertex form.", answer: "\\(h(t) = (t-4)^2 + 4\\).", solution: "\\((t-4)^2 = t^2 - 8t + 16\\), so add 4." }
          ]
        },
        {
          title: "The Quadratic Formula",
          questions: [
            { type: "regular", q: "State the quadratic formula.", answer: "\\(x = \\dfrac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}\\).", solution: "For \\(ax^2 + bx + c = 0\\)." },
            { type: "regular", q: "Solve \\( 2x^2 + 3x - 2 = 0 \\).", answer: "\\(x = \\tfrac{1}{2}, -2\\).", solution: "Discriminant \\(9 + 16 = 25\\); \\(x = \\frac{-3 \\pm 5}{4}\\)." },
            { type: "word", q: "A rocket's height is \\( h(t) = -5t^2 + 20t + 3 \\). When does it hit the ground?", answer: "\\(t \\approx 4.14\\) s.", solution: "Set \\(h = 0\\), apply formula with \\(a=-5, b=20, c=3\\)." }
          ]
        },
        {
          title: "The Vertex of a Parabola",
          questions: [
            { type: "regular", q: "Find the vertex of \\( f(x) = x^2 - 6x + 11 \\).", answer: "\\((3, 2)\\).", solution: "\\(x = -b/2a = 3\\); \\(f(3) = 2\\)." },
            { type: "regular", q: "Find the vertex of \\( f(x) = -(x-5)^2 + 4 \\).", answer: "\\((5, 4)\\).", solution: "Read off vertex form." },
            { type: "word", q: "A farmer's profit is \\( P(x) = -2x^2 + 40x - 100 \\). What \\(x\\) maximizes profit?", answer: "\\(x = 10\\).", solution: "Vertex at \\(x = -40/(2 \\cdot -2) = 10\\)." }
          ]
        },
        {
          title: "Graphing a Parabola",
          questions: [
            { type: "regular", q: "Does \\( y = -3x^2 + 2 \\) open up or down?", answer: "Down.", solution: "Leading coefficient negative." },
            { type: "regular", q: "Find the axis of symmetry for \\( y = x^2 + 4x + 1 \\).", answer: "\\(x = -2\\).", solution: "\\(x = -b/2a = -4/2 = -2\\)." },
            { type: "word", q: "A bridge arch follows \\( y = -0.01x^2 + 2x \\). Find its maximum height.", answer: "100 units.", solution: "\\(x = 100\\); \\(y = -100 + 200 = 100\\)." }
          ]
        },
        {
          title: "Scenarios Involving Quadratics",
          questions: [
            { type: "regular", q: "A projectile follows \\( h(t) = -16t^2 + 32t \\). Max height?", answer: "16 ft at \\(t=1\\).", solution: "Vertex at \\(t = 1\\); \\(h = 16\\)." },
            { type: "regular", q: "Area \\(A = x(20-x)\\). Find \\(x\\) maximizing \\(A\\).", answer: "\\(x = 10\\).", solution: "Max at vertex of \\(-x^2 + 20x\\)." },
            { type: "word", q: "A garden's width is \\(x\\) and length is \\(x+4\\). Its area is 45 sq ft. Find \\(x\\).", answer: "\\(x = 5\\) ft.", solution: "\\(x(x+4) = 45 \\Rightarrow x^2 + 4x - 45 = 0 \\Rightarrow (x-5)(x+9)=0\\)." }
          ]
        },
        {
          title: "Graphing Quadratic Inequalities",
          questions: [
            { type: "regular", q: "For \\( y \\geq x^2 \\), is the parabola solid or dashed?", answer: "Solid.", solution: "Non-strict inequality." },
            { type: "regular", q: "Shade above or below for \\( y < -x^2 + 3 \\)?", answer: "Below (with dashed curve).", solution: "Strict \\(<\\), shade \\(y\\) less than." },
            { type: "word", q: "A region is described by \\( y \\geq x^2 - 4 \\). Is \\((0, 0)\\) included?", answer: "Yes.", solution: "\\(0 \\geq -4\\) — true." }
          ]
        }
      ]
    },
    {
      id: "b4",
      num: 4,
      title: "Rational Expressions & Equations",
      subtitle: "The Rational Realm",
      emoji: "➗",
      accent: "#43e97b",
      accent2: "#38f9d7",
      sections: [
        {
          title: "Introduction to Rational Expressions",
          questions: [
            { type: "regular", q: "What is a rational expression?", answer: "A ratio of two polynomials.", solution: "Like a fraction, but with polynomials." },
            { type: "regular", q: "For what value of \\(x\\) is \\( \\dfrac{x+2}{x-3} \\) undefined?", answer: "\\(x = 3\\).", solution: "Denominator zero." },
            { type: "word", q: "A recipe ratio is \\(\\dfrac{sugar}{flour} = \\dfrac{x+1}{2x}\\). Find values of \\(x\\) making it undefined.", answer: "\\(x = 0\\).", solution: "Only value making denominator 0." }
          ]
        },
        {
          title: "Using a Disguised Form of 1",
          questions: [
            { type: "regular", q: "Rewrite \\( \\dfrac{2}{3} \\) with denominator 15.", answer: "\\(\\dfrac{10}{15}\\).", solution: "Multiply by \\(\\frac{5}{5} = 1\\)." },
            { type: "regular", q: "Rewrite \\( \\dfrac{x}{x+1} \\) with denominator \\((x+1)(x-2)\\).", answer: "\\(\\dfrac{x(x-2)}{(x+1)(x-2)}\\).", solution: "Multiply top and bottom by \\((x-2)\\)." },
            { type: "word", q: "Why does multiplying a fraction by \\(\\tfrac{a}{a}\\) (\\(a \\neq 0\\)) not change its value?", answer: "Because \\(\\tfrac{a}{a} = 1\\).", solution: "Multiplying by 1 preserves value." }
          ]
        },
        {
          title: "Simplifying Rational Expressions",
          questions: [
            { type: "regular", q: "Simplify \\( \\dfrac{x^2 - 9}{x - 3} \\).", answer: "\\(x + 3\\) (for \\(x \\neq 3\\)).", solution: "Factor top as \\((x-3)(x+3)\\), cancel." },
            { type: "regular", q: "Simplify \\( \\dfrac{2x^2 + 6x}{4x} \\).", answer: "\\(\\dfrac{x+3}{2}\\).", solution: "Factor \\(2x\\), cancel." },
            { type: "word", q: "A cost formula is \\(\\dfrac{x^2-16}{x+4}\\). Simplify and note restrictions.", answer: "\\(x - 4\\), \\(x \\neq -4\\).", solution: "Difference of squares, cancel \\((x+4)\\)." }
          ]
        },
        {
          title: "Multiplying Rational Expressions",
          questions: [
            { type: "regular", q: "Multiply \\( \\dfrac{2}{x} \\cdot \\dfrac{x+1}{4} \\).", answer: "\\(\\dfrac{x+1}{2x}\\).", solution: "Multiply tops and bottoms, simplify." },
            { type: "regular", q: "Multiply \\( \\dfrac{x^2-1}{x} \\cdot \\dfrac{x}{x+1} \\).", answer: "\\(x - 1\\).", solution: "Factor \\((x-1)(x+1)\\), cancel \\(x\\) and \\((x+1)\\)." },
            { type: "word", q: "A rate is \\(\\tfrac{x}{2}\\) per hour and time is \\(\\tfrac{6}{x+1}\\) hours. Find total.", answer: "\\(\\dfrac{3x}{x+1}\\).", solution: "Rate × time: \\(\\frac{x}{2} \\cdot \\frac{6}{x+1} = \\frac{3x}{x+1}\\)." }
          ]
        },
        {
          title: "Dividing Rational Expressions",
          questions: [
            { type: "regular", q: "Divide \\( \\dfrac{3}{x} \\div \\dfrac{6}{x^2} \\).", answer: "\\(\\dfrac{x}{2}\\).", solution: "Flip and multiply: \\(\\frac{3}{x} \\cdot \\frac{x^2}{6}\\)." },
            { type: "regular", q: "Simplify \\( \\dfrac{x+2}{x} \\div \\dfrac{x+2}{x-1} \\).", answer: "\\(\\dfrac{x-1}{x}\\).", solution: "Multiply by reciprocal, cancel \\((x+2)\\)." },
            { type: "word", q: "If \\(\\tfrac{x^2}{4}\\) pizzas are split among \\(\\tfrac{x}{2}\\) friends, how much does each get?", answer: "\\(\\dfrac{x}{2}\\) pizzas.", solution: "\\(\\frac{x^2}{4} \\div \\frac{x}{2} = \\frac{x^2}{4} \\cdot \\frac{2}{x} = \\frac{x}{2}\\)." }
          ]
        },
        {
          title: "Adding & Subtracting Rational Expressions",
          questions: [
            { type: "regular", q: "Add \\( \\dfrac{1}{x} + \\dfrac{2}{x} \\).", answer: "\\(\\dfrac{3}{x}\\).", solution: "Common denominator." },
            { type: "regular", q: "Add \\( \\dfrac{1}{x} + \\dfrac{1}{x+1} \\).", answer: "\\(\\dfrac{2x+1}{x(x+1)}\\).", solution: "LCD is \\(x(x+1)\\); combine numerators." },
            { type: "word", q: "Alice finishes a job in \\(x\\) hours; Bob in \\(x+2\\). Combined rate?", answer: "\\(\\dfrac{2x+2}{x(x+2)}\\) jobs/hour.", solution: "Add rates \\(\\frac{1}{x} + \\frac{1}{x+2}\\)." }
          ]
        },
        {
          title: "Equations with Rational Expressions",
          questions: [
            { type: "regular", q: "Solve \\( \\dfrac{3}{x} = 6 \\).", answer: "\\(x = \\tfrac{1}{2}\\).", solution: "Cross multiply: \\(3 = 6x\\)." },
            { type: "regular", q: "Solve \\( \\dfrac{x+1}{2} = \\dfrac{x-1}{3} \\).", answer: "\\(x = -5\\).", solution: "Cross multiply: \\(3(x+1) = 2(x-1)\\)." },
            { type: "word", q: "Together, two pipes fill a tank in 6 hours. Alone, pipe A takes \\(x\\), pipe B takes \\(x+5\\). Set up the equation.", answer: "\\(\\dfrac{1}{x} + \\dfrac{1}{x+5} = \\dfrac{1}{6}\\).", solution: "Rates sum to combined rate." }
          ]
        },
        {
          title: "Extraneous Solutions",
          questions: [
            { type: "regular", q: "Solve \\( \\dfrac{x}{x-2} = \\dfrac{2}{x-2} \\).", answer: "No solution.", solution: "Cross multiplying gives \\(x = 2\\), but that makes denominator 0 — extraneous." },
            { type: "regular", q: "What makes a solution extraneous?", answer: "It violates the original equation's restrictions.", solution: "Usually it makes a denominator 0." },
            { type: "word", q: "Why do we always check solutions back in the original rational equation?", answer: "To catch extraneous solutions that invalidate denominators.", solution: "Algebra can introduce forbidden values." }
          ]
        }
      ]
    },
    {
      id: "b5",
      num: 6,
      title: "Systems",
      subtitle: "The Systems Stronghold",
      emoji: "⚙️",
      accent: "#f093fb",
      accent2: "#f5576c",
      sections: [
        {
          title: "Graphing, Substitution, and Elimination",
          questions: [
            { type: "regular", q: "Solve by substitution: \\( y = 2x,\\ x + y = 9 \\).", answer: "\\((3, 6)\\).", solution: "Sub \\(y=2x\\): \\(x + 2x = 9 \\Rightarrow x = 3\\)." },
            { type: "regular", q: "Solve by elimination: \\( x + y = 7,\\ x - y = 3 \\).", answer: "\\((5, 2)\\).", solution: "Add: \\(2x = 10\\); sub back." },
            { type: "word", q: "Two numbers sum to 20 and differ by 4. Find them.", answer: "12 and 8.", solution: "\\(x + y = 20,\\ x - y = 4\\)." }
          ]
        },
        {
          title: "Scenarios Involving Linear Systems",
          questions: [
            { type: "regular", q: "Adult ticket $12, child $8. 50 tickets sold for $520. How many of each?", answer: "30 adult, 20 child.", solution: "\\(a+c=50,\\ 12a+8c=520\\)." },
            { type: "regular", q: "5 shirts + 2 pants = $90; 3 shirts + 1 pants = $50. Shirt price?", answer: "$10.", solution: "Double second: \\(6s + 2p = 100\\); subtract: \\(s = 10\\)." },
            { type: "word", q: "A boat goes 20 mi downstream in 1 hr and 20 mi up in 2 hr. Boat + current speeds?", answer: "Boat 15 mph, current 5 mph.", solution: "\\(b+c=20,\\ b-c=10\\)." }
          ]
        },
        {
          title: "Systems of Linear Inequalities",
          questions: [
            { type: "regular", q: "Is \\((2, 3)\\) in the system \\( y > x,\\ y < 5 \\)?", answer: "Yes.", solution: "\\(3 > 2\\) and \\(3 < 5\\)." },
            { type: "regular", q: "Shade the region: \\( y \\geq 2x,\\ y \\leq x + 4 \\). What kind of region?", answer: "Overlap strip between the two lines.", solution: "Intersection of two half-planes." },
            { type: "word", q: "You work at most 20 hours/wk, earning $10/hr babysitting or $15/hr tutoring, aiming for at least $200. Set up.", answer: "\\(b + t \\leq 20,\\ 10b + 15t \\geq 200,\\ b, t \\geq 0\\).", solution: "Constraints from each condition." }
          ]
        },
        {
          title: "Nonlinear Systems",
          questions: [
            { type: "regular", q: "Solve \\( y = x^2,\\ y = x + 2 \\).", answer: "\\((-1, 1)\\) and \\((2, 4)\\).", solution: "\\(x^2 = x + 2 \\Rightarrow x^2 - x - 2 = 0\\)." },
            { type: "regular", q: "Solve \\( x^2 + y^2 = 25,\\ y = x \\).", answer: "\\(\\pm(\\tfrac{5}{\\sqrt{2}}, \\tfrac{5}{\\sqrt{2}})\\).", solution: "Sub \\(y=x\\): \\(2x^2 = 25\\)." },
            { type: "word", q: "A circle of radius 5 centered at origin and the line \\(y = 3\\) intersect where?", answer: "\\((\\pm 4, 3)\\).", solution: "\\(x^2 + 9 = 25 \\Rightarrow x = \\pm 4\\)." }
          ]
        },
        {
          title: "Systems with 3 Variables",
          questions: [
            { type: "regular", q: "Solve: \\(x+y+z=6,\\ x-y+z=2,\\ 2x+y-z=1\\).", answer: "\\((1, 2, 3)\\).", solution: "Subtract eq1-eq2: \\(2y=4, y=2\\). Then \\(x+z=4,\\ 2x-z=-1\\Rightarrow x=1,z=3\\)." },
            { type: "regular", q: "How many solutions can a 3-variable linear system have?", answer: "One, none, or infinitely many.", solution: "Like 2-variable systems, but in 3D." },
            { type: "word", q: "A snack mix has 3x peanuts, cashews, raisins. Total 12 lb, peanuts = sum of others, cashews = 2× raisins. Find amounts.", answer: "6 lb peanuts, 4 lb cashews, 2 lb raisins.", solution: "\\(p+c+r=12,\\ p=c+r,\\ c=2r\\)." }
          ]
        },
        {
          title: "Writing a Parabola from 3 Points",
          questions: [
            { type: "regular", q: "Find the parabola through \\((0,1),(1,2),(2,5)\\).", answer: "\\(y = x^2 + 1\\).", solution: "Solve \\(c=1,\\ a+b+c=2,\\ 4a+2b+c=5\\)." },
            { type: "regular", q: "Find the parabola through \\((-1,0),(0,-3),(2,5)\\).", answer: "\\(y = 2x^2 + x - 3\\).", solution: "Solve for \\(a,b,c\\) using all three points." },
            { type: "word", q: "A ball's height at \\(t=0,1,2\\) is 5, 20, 23. Write a quadratic model \\(h(t)\\).", answer: "\\(h(t) = -6t^2 + 21t + 5\\).", solution: "Solve three equations for \\(a,b,c\\)." }
          ]
        }
      ]
    },
    {
      id: "b6",
      num: 7,
      title: "Radicals",
      subtitle: "The Radical Ruins",
      emoji: "√",
      accent: "#4facfe",
      accent2: "#00f2fe",
      sections: [
        {
          title: "Exponents and Roots",
          questions: [
            { type: "regular", q: "Evaluate \\( 16^{1/2} \\).", answer: "4.", solution: "\\(16^{1/2} = \\sqrt{16} = 4\\)." },
            { type: "regular", q: "Evaluate \\( 27^{2/3} \\).", answer: "9.", solution: "\\((\\sqrt[3]{27})^2 = 3^2 = 9\\)." },
            { type: "word", q: "A cube has volume 64 cm³. Side length?", answer: "4 cm.", solution: "\\(\\sqrt[3]{64} = 4\\)." }
          ]
        },
        {
          title: "Rational vs. Irrational Numbers",
          questions: [
            { type: "regular", q: "Is \\( \\sqrt{2} \\) rational or irrational?", answer: "Irrational.", solution: "Non-terminating, non-repeating decimal." },
            { type: "regular", q: "Is \\( 0.\\overline{3} \\) rational?", answer: "Yes.", solution: "Equals \\(\\tfrac{1}{3}\\)." },
            { type: "word", q: "A side of a unit square's diagonal — rational or irrational? Why?", answer: "Irrational — it equals \\(\\sqrt{2}\\).", solution: "Pythagoras: \\(\\sqrt{1^2+1^2} = \\sqrt{2}\\)." }
          ]
        },
        {
          title: "Simplifying Radical Expressions",
          questions: [
            { type: "regular", q: "Simplify \\( \\sqrt{98} \\).", answer: "\\(7\\sqrt{2}\\).", solution: "\\(\\sqrt{49 \\cdot 2}\\)." },
            { type: "regular", q: "Simplify \\( \\sqrt{x^4 y^3} \\) (\\(x, y \\geq 0\\)).", answer: "\\(x^2 y\\sqrt{y}\\).", solution: "Pull out squares." },
            { type: "word", q: "A square has area 200 in². Find side length.", answer: "\\(10\\sqrt{2}\\) in.", solution: "\\(\\sqrt{200} = \\sqrt{100 \\cdot 2}\\)." }
          ]
        },
        {
          title: "Solving Equations with Radicals",
          questions: [
            { type: "regular", q: "Solve \\( \\sqrt{x} = 5 \\).", answer: "\\(x = 25\\).", solution: "Square both sides." },
            { type: "regular", q: "Solve \\( \\sqrt{x+3} = x - 3 \\).", answer: "\\(x = 6\\) (check rejects \\(x = 1\\)).", solution: "Square, solve quadratic, check." },
            { type: "word", q: "The time to fall \\(h\\) ft is \\( t = \\tfrac{\\sqrt{h}}{4} \\). Solve for \\(h\\) when \\(t = 2\\).", answer: "64 ft.", solution: "\\(\\sqrt{h} = 8\\); \\(h = 64\\)." }
          ]
        },
        {
          title: "Multiplication with Radicals",
          questions: [
            { type: "regular", q: "Multiply \\( \\sqrt{3} \\cdot \\sqrt{12} \\).", answer: "6.", solution: "\\(\\sqrt{36} = 6\\)." },
            { type: "regular", q: "Multiply \\( (2\\sqrt{5})(3\\sqrt{10}) \\).", answer: "\\(30\\sqrt{2}\\).", solution: "\\(6\\sqrt{50} = 6 \\cdot 5\\sqrt{2}\\)." },
            { type: "word", q: "A rectangle has sides \\(\\sqrt{6}\\) and \\(\\sqrt{24}\\). Find area.", answer: "12 sq units.", solution: "\\(\\sqrt{6 \\cdot 24} = \\sqrt{144}\\)." }
          ]
        },
        {
          title: "Addition and Subtraction with Radicals",
          questions: [
            { type: "regular", q: "Simplify \\( 3\\sqrt{2} + 5\\sqrt{2} \\).", answer: "\\(8\\sqrt{2}\\).", solution: "Combine like radicals." },
            { type: "regular", q: "Simplify \\( \\sqrt{50} - \\sqrt{18} \\).", answer: "\\(2\\sqrt{2}\\).", solution: "\\(5\\sqrt{2} - 3\\sqrt{2}\\)." },
            { type: "word", q: "Two ladders: \\(\\sqrt{45}\\) and \\(\\sqrt{80}\\) ft. Total length?", answer: "\\(7\\sqrt{5}\\) ft.", solution: "\\(3\\sqrt{5} + 4\\sqrt{5}\\)." }
          ]
        },
        {
          title: "Distributive Property with Radicals",
          questions: [
            { type: "regular", q: "Expand \\( \\sqrt{3}(\\sqrt{6} + \\sqrt{2}) \\).", answer: "\\(3\\sqrt{2} + \\sqrt{6}\\).", solution: "Distribute: \\(\\sqrt{18} + \\sqrt{6}\\)." },
            { type: "regular", q: "Expand \\( (\\sqrt{5} + 2)(\\sqrt{5} - 2) \\).", answer: "1.", solution: "Difference of squares: \\(5 - 4\\)." },
            { type: "word", q: "A rectangle has length \\((\\sqrt{3}+1)\\) and width \\((\\sqrt{3}-1)\\). Find area.", answer: "2 sq units.", solution: "\\((\\sqrt{3})^2 - 1^2 = 3 - 1\\)." }
          ]
        },
        {
          title: "Simplifying Radicals with Fractions",
          questions: [
            { type: "regular", q: "Simplify \\( \\sqrt{\\dfrac{9}{16}} \\).", answer: "\\(\\tfrac{3}{4}\\).", solution: "Split: \\(\\frac{\\sqrt{9}}{\\sqrt{16}}\\)." },
            { type: "regular", q: "Simplify \\( \\sqrt{\\dfrac{50}{25}} \\).", answer: "\\(\\sqrt{2}\\).", solution: "\\(\\sqrt{2}\\)." },
            { type: "word", q: "Area of a square is \\(\\tfrac{49}{4}\\). Side length?", answer: "\\(\\tfrac{7}{2}\\).", solution: "\\(\\sqrt{49/4} = 7/2\\)." }
          ]
        },
        {
          title: "Rationalizing a Denominator",
          questions: [
            { type: "regular", q: "Rationalize \\( \\dfrac{1}{\\sqrt{2}} \\).", answer: "\\(\\dfrac{\\sqrt{2}}{2}\\).", solution: "Multiply by \\(\\frac{\\sqrt{2}}{\\sqrt{2}}\\)." },
            { type: "regular", q: "Rationalize \\( \\dfrac{3}{\\sqrt{5}-1} \\).", answer: "\\(\\dfrac{3(\\sqrt{5}+1)}{4}\\).", solution: "Multiply by conjugate." },
            { type: "word", q: "Why is it useful to have no radical in the denominator?", answer: "Standard form; easier comparison and computation.", solution: "Historical convention and simpler arithmetic." }
          ]
        },
        {
          title: "The Pythagorean Theorem",
          questions: [
            { type: "regular", q: "Find \\(c\\) if \\(a=6, b=8\\).", answer: "10.", solution: "\\(\\sqrt{36+64} = \\sqrt{100}\\)." },
            { type: "regular", q: "Find the missing leg if hypotenuse 13, one leg 5.", answer: "12.", solution: "\\(\\sqrt{169-25} = \\sqrt{144}\\)." },
            { type: "word", q: "A ladder is 13 ft long and its base is 5 ft from a wall. How high on the wall does it reach?", answer: "12 ft.", solution: "Pythagorean theorem." }
          ]
        }
      ]
    }
  ]
};
