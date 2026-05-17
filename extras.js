// Extends each section to 5 questions and adds a cumulative test per book.
// Loaded AFTER courses.js so COURSES exists.

function _addQ(courseId, bookId, sIdx, qs) {
  const b = COURSES[courseId].books.find(x => x.id === bookId);
  if (b) b.sections[sIdx].questions.push(...qs);
}
function _setCum(courseId, bookId, test) {
  const b = COURSES[courseId].books.find(x => x.id === bookId);
  if (b) b.cumulativeTest = test;
}
const R = (q, answer, solution) => ({ type: 'regular', q, answer, solution });
const W = (q, answer, solution) => ({ type: 'word', q, answer, solution });

/* ============ ALGEBRA ============ */

// Book 1: Intro to Functions
_addQ('algebra', 'b1', 0, [
  R("A vending machine's cost \\(C\\) depends on the number of snacks \\(n\\). Which is independent?", "\\(n\\) is independent.", "You choose \\(n\\); cost reacts."),
  W("Temperature rises as the day progresses. Name the independent and dependent variables.", "Time independent, temperature dependent.", "Time passes on its own; temperature depends on time.")
]);
_addQ('algebra', 'b1', 1, [
  R("If \\(f(x) = 4x + 1\\), is this a function?", "Yes.", "Every \\(x\\) gives one \\(y\\)."),
  W("A car's total cost \\(C\\) for \\(m\\) miles is \\(C = 0.5m + 50\\). Find \\(C\\) for 200 miles.", "$150.", "\\(0.5(200) + 50 = 150\\).")
]);
_addQ('algebra', 'b1', 2, [
  R("On what interval is \\(f(x) = -x + 3\\) decreasing?", "All reals.", "Slope is negative, so always decreasing."),
  W("A flight climbs for 10 min, cruises for 2 hours, and descends for 15 min. Describe each phase.", "Increasing, constant, decreasing.", "Altitude changes in each phase accordingly.")
]);
_addQ('algebra', 'b1', 3, [
  R("Find the domain of \\(f(x) = \\sqrt{x - 2}\\).", "\\(x \\geq 2\\).", "Radicand must be non-negative."),
  W("A gym lets members work out between 0 and 180 minutes daily. State the domain and range if calories burned is \\(5m\\).", "Domain: \\(0 \\le m \\le 180\\); Range: \\(0 \\le c \\le 900\\).", "Plug endpoints into \\(c = 5m\\).")
]);
_addQ('algebra', 'b1', 4, [
  R("If \\(h(x) = x^2 + 1\\), find \\(h(0)\\).", "1.", "\\(0^2 + 1 = 1\\)."),
  W("A printer prints \\(p(t) = 30t\\) pages in \\(t\\) minutes. How many pages in 12 minutes?", "360 pages.", "\\(30(12) = 360\\).")
]);
_setCum('algebra', 'b1', {
  title: "Cumulative Test — Intro to Functions",
  questions: [
    R("Is \\(x = y^2\\) a function of \\(x\\)?", "No.", "Fails vertical-line test."),
    R("Given \\(f(x) = 3x - 7\\), find \\(f(4)\\).", "5.", "\\(3(4) - 7 = 5\\)."),
    R("Domain of \\(f(x) = \\dfrac{1}{x + 5}\\)?", "\\(x \\ne -5\\).", "Denominator can't be 0."),
    R("On what interval does \\(f(x) = x^2\\) increase?", "\\((0, \\infty)\\).", "Right of vertex it rises."),
    W("A taxi charges $4 plus $2.50 per mile. Write cost \\(C\\) as a function of miles \\(m\\).", "\\(C(m) = 2.5m + 4\\).", "Fixed start + per-mile rate."),
    W("Plumber earns $18/hr. State domain and range if she works up to 10 hours and let \\(E\\) be earnings.", "Domain \\(0 \\le h \\le 10\\); Range \\(0 \\le E \\le 180\\).", "\\(E = 18h\\); plug endpoints.")
  ]
});

// Book 2: Linear Functions
_addQ('algebra', 'b2', 0, [
  R("Which quadrant has both coordinates negative?", "Quadrant III.", "Negative \\(x\\) and \\(y\\) lives in QIII."),
  W("A map places the library at the origin. A cafe is 3 east and 4 south. How far away?", "5 units.", "\\(\\sqrt{9+16} = 5\\).")
]);
_addQ('algebra', 'b2', 1, [
  R("Slope through \\((1,2)\\) and \\((4,2)\\)?", "0.", "Horizontal line, rise is 0."),
  W("A hill rises 6 ft over 48 ft of horizontal run. Slope?", "\\(\\tfrac{1}{8}\\).", "\\(6/48 = 1/8\\).")
]);
_addQ('algebra', 'b2', 2, [
  R("Graph \\(y = 3x - 2\\). What's the y-intercept?", "\\(-2\\).", "Constant term is the intercept."),
  W("A pool loses 2 gallons/hr starting from 500 gallons. Write \\(V(t)\\).", "\\(V(t) = 500 - 2t\\).", "Start minus rate times time.")
]);
_addQ('algebra', 'b2', 3, [
  R("Convert \\(y = -\\tfrac{1}{2}x + 3\\) to standard form with integer coefficients.", "\\(x + 2y = 6\\).", "Multiply by 2: \\(2y = -x + 6\\)."),
  W("A booth sells popcorn at $3 and drinks at $2, earning $60. Standard form with \\(p\\), \\(d\\).", "\\(3p + 2d = 60\\).", "Total revenue.")
]);
_addQ('algebra', 'b2', 4, [
  R("Write the line through \\((-1, 4)\\) with slope \\(-3\\) in point-slope form.", "\\(y - 4 = -3(x + 1)\\).", "Plug into \\(y - y_1 = m(x - x_1)\\)."),
  W("A plant is 12 in. after 3 weeks and 20 in. after 7 weeks. Write \\(h(w)\\).", "\\(h - 12 = 2(w - 3)\\) or \\(h = 2w + 6\\).", "Slope \\(8/4 = 2\\).")
]);
_addQ('algebra', 'b2', 5, [
  R("Trend line \\(y = -0.5x + 10\\). Predict \\(y\\) at \\(x = 20\\).", "0.", "\\(-0.5(20) + 10 = 0\\)."),
  W("Data shows study hours vs. test score roughly \\(S = 5h + 60\\). Predicted score for 6 hours?", "90.", "\\(5(6) + 60 = 90\\).")
]);
_addQ('algebra', 'b2', 6, [
  R("Slope of a horizontal line?", "0.", "No rise, so slope is 0."),
  W("A conveyor belt moves at exactly 2 ft/s forever. Describe speed over time.", "Horizontal line at \\(y = 2\\).", "Constant rate = horizontal line.")
]);
_addQ('algebra', 'b2', 7, [
  R("Is \\((0, 0)\\) a solution to \\(y < 2x - 1\\)?", "No.", "\\(0 < -1\\) is false."),
  W("A shopper has $50 for shirts ($15) and pants ($25). Write the inequality for \\(s\\), \\(p\\).", "\\(15s + 25p \\le 50\\).", "Total spent within budget.")
]);
_setCum('algebra', 'b2', {
  title: "Cumulative Test — Linear Functions",
  questions: [
    R("Slope through \\((2, 5)\\) and \\((6, 13)\\)?", "2.", "\\((13-5)/(6-2)\\)."),
    R("Write \\(y = 4x + 1\\) in standard form.", "\\(4x - y = -1\\).", "Move \\(4x\\), flip sign."),
    R("Equation of the horizontal line through \\((5, -2)\\)?", "\\(y = -2\\).", "Constant \\(y\\)."),
    R("Slope of a line perpendicular to \\(y = \\tfrac{2}{3}x + 1\\)?", "\\(-\\tfrac{3}{2}\\).", "Negative reciprocal."),
    W("A contractor charges $150 plus $80/hr. Write total cost \\(C(h)\\).", "\\(C(h) = 80h + 150\\).", "Flat fee + hourly."),
    W("Is \\((3, 4)\\) a solution to \\(y \\ge 2x - 3\\)?", "Yes.", "\\(4 \\ge 3\\) true."),
    R("Point-slope form through \\((4, -1)\\) with slope \\(\\tfrac{1}{2}\\)?", "\\(y + 1 = \\tfrac{1}{2}(x - 4)\\).", "Plug into formula.")
  ]
});

// Book 3: Quadratic Functions
_addQ('algebra', 'b3', 0, [
  R("Is \\(f(x) = 2x - 5\\) quadratic?", "No.", "Highest power is 1, not 2."),
  W("A fenced area is \\(A(x) = -x^2 + 40x\\). What shape of graph?", "A downward parabola.", "Negative leading coefficient.")
]);
_addQ('algebra', 'b3', 1, [
  R("Factor \\(x^2 + 5x + 6\\).", "\\((x+2)(x+3)\\).", "Factors of 6 that add to 5."),
  W("A box has area \\(x^2 + 8x + 15\\) and one side is \\(x + 3\\). Find the other.", "\\(x + 5\\).", "Factor: \\((x+3)(x+5)\\).")
]);
_addQ('algebra', 'b3', 2, [
  R("Simplify \\(\\sqrt{75}\\).", "\\(5\\sqrt{3}\\).", "\\(\\sqrt{25 \\cdot 3}\\)."),
  W("A square has area 128 sq in. Side length?", "\\(8\\sqrt{2}\\) in.", "\\(\\sqrt{128} = \\sqrt{64 \\cdot 2}\\).")
]);
_addQ('algebra', 'b3', 3, [
  R("Simplify \\(i^3\\).", "\\(-i\\).", "\\(i^3 = i^2 \\cdot i = -i\\)."),
  W("Does \\(x^2 + 9 = 0\\) have real solutions?", "No — solutions \\(\\pm 3i\\).", "Negative under square root.")
]);
_addQ('algebra', 'b3', 4, [
  R("Solve \\(x^2 - 16 = 0\\).", "\\(x = \\pm 4\\).", "Difference of squares."),
  W("The square of a number equals 64. Find the number.", "\\(\\pm 8\\).", "\\(x^2 = 64 \\Rightarrow x = \\pm 8\\).")
]);
_addQ('algebra', 'b3', 5, [
  R("Complete the square: \\(x^2 - 10x\\).", "\\((x - 5)^2 - 25\\).", "Half of \\(-10\\) is \\(-5\\); \\((-5)^2 = 25\\)."),
  W("Rewrite \\(f(x) = x^2 - 4x + 7\\) in vertex form.", "\\(f(x) = (x - 2)^2 + 3\\).", "Complete the square.")
]);
_addQ('algebra', 'b3', 6, [
  R("Use the quadratic formula on \\(x^2 - 3x - 10 = 0\\).", "\\(x = 5, -2\\).", "Discriminant 49; \\((3 \\pm 7)/2\\)."),
  W("Solve \\(2x^2 - x - 3 = 0\\) using the formula.", "\\(x = \\tfrac{3}{2}, -1\\).", "Discriminant \\(1 + 24 = 25\\).")
]);
_addQ('algebra', 'b3', 7, [
  R("Vertex of \\(y = 2(x - 3)^2 + 1\\)?", "\\((3, 1)\\).", "Read from vertex form."),
  W("Revenue \\(R = -x^2 + 10x\\). What \\(x\\) maximizes?", "\\(x = 5\\).", "Vertex at \\(x = -b/2a\\).")
]);
_addQ('algebra', 'b3', 8, [
  R("Axis of symmetry of \\(y = x^2 - 8x + 3\\)?", "\\(x = 4\\).", "\\(x = -b/2a = 8/2\\)."),
  W("A jumper's height is \\(h(t) = -16t^2 + 32t + 4\\). When is max height reached?", "At \\(t = 1\\) s.", "Vertex at \\(t = 32/32 = 1\\).")
]);
_addQ('algebra', 'b3', 9, [
  R("Max area with perimeter 40?", "100 (a square).", "Max of \\(A = x(20-x)\\) at \\(x = 10\\)."),
  W("A rectangle's length is \\(x + 2\\) and width is \\(x\\). Area is 48. Find \\(x\\).", "\\(x = 6\\).", "\\(x^2 + 2x - 48 = 0\\); \\((x-6)(x+8) = 0\\).")
]);
_addQ('algebra', 'b3', 10, [
  R("For \\(y \\le x^2 - 1\\), is \\((0, 0)\\) in the solution?", "No.", "\\(0 \\le -1\\) is false."),
  W("A region is \\(y \\ge -x^2 + 4\\). Is \\((0, 4)\\) included?", "Yes.", "\\(4 \\ge 4\\) true.")
]);
_setCum('algebra', 'b3', {
  title: "Cumulative Test — Quadratic Functions",
  questions: [
    R("Factor \\(x^2 - 7x + 12\\).", "\\((x-3)(x-4)\\).", "Factors of 12 that add to \\(-7\\)."),
    R("Solve \\(x^2 + 2x - 15 = 0\\).", "\\(x = 3, -5\\).", "\\((x+5)(x-3) = 0\\)."),
    R("Find the vertex of \\(y = (x+1)^2 - 9\\).", "\\((-1, -9)\\).", "Vertex form."),
    R("Simplify \\(\\sqrt{-36}\\).", "\\(6i\\).", "\\(\\sqrt{-1 \\cdot 36} = 6i\\)."),
    W("A stone is thrown up with \\(h(t) = -5t^2 + 20t\\). Max height?", "20 m at \\(t = 2\\).", "Vertex at \\(t = 2\\); \\(h = 20\\)."),
    W("A rectangular yard has area 60 and length 4 more than width. Find width.", "\\(w = 6\\).", "\\(w(w+4) = 60\\); \\(w = 6\\)."),
    R("Use the quadratic formula on \\(x^2 + 6x + 5 = 0\\).", "\\(x = -1, -5\\).", "Discriminant 16.")
  ]
});

// Book 4: Rational Expressions
_addQ('algebra', 'b4', 0, [
  R("For what \\(x\\) is \\(\\dfrac{2x}{x^2 - 4}\\) undefined?", "\\(x = \\pm 2\\).", "Denominator zero when \\(x^2 = 4\\)."),
  W("A recipe uses \\(\\dfrac{x+3}{x}\\) cups of flour. For what value is it undefined?", "\\(x = 0\\).", "Division by zero.")
]);
_addQ('algebra', 'b4', 1, [
  R("Rewrite \\(\\dfrac{3}{x-1}\\) with denominator \\((x-1)(x+2)\\).", "\\(\\dfrac{3(x+2)}{(x-1)(x+2)}\\).", "Multiply top and bottom by \\((x+2)\\)."),
  W("Why is multiplying numerator and denominator by the same nonzero expression allowed?", "Because that ratio equals 1, preserving value.", "Multiplying by 1 is identity.")
]);
_addQ('algebra', 'b4', 2, [
  R("Simplify \\(\\dfrac{x^2 - 4}{x + 2}\\).", "\\(x - 2\\), \\(x \\ne -2\\).", "Factor: \\((x-2)(x+2)\\)."),
  W("A rate formula is \\(\\dfrac{3x^2 - 12}{x - 2}\\). Simplify.", "\\(3(x + 2)\\), \\(x \\ne 2\\).", "Factor out 3: \\(3(x-2)(x+2)\\).")
]);
_addQ('algebra', 'b4', 3, [
  R("Multiply \\(\\dfrac{x}{2} \\cdot \\dfrac{4}{x^2}\\).", "\\(\\dfrac{2}{x}\\).", "\\(\\frac{4x}{2x^2} = \\frac{2}{x}\\)."),
  W("If the unit price is \\(\\dfrac{x}{5}\\) and you buy \\(\\dfrac{10}{x}\\), total?", "2.", "\\(\\frac{x}{5} \\cdot \\frac{10}{x} = 2\\).")
]);
_addQ('algebra', 'b4', 4, [
  R("Simplify \\(\\dfrac{x+1}{x} \\div \\dfrac{x+1}{2x}\\).", "2.", "Flip and multiply, then cancel."),
  W("A pizza is \\(\\tfrac{x}{3}\\) of a pie divided by \\(\\tfrac{x}{9}\\) of a pie per person. How many people?", "3.", "\\(\\frac{x/3}{x/9} = 3\\).")
]);
_addQ('algebra', 'b4', 5, [
  R("Subtract \\(\\dfrac{5}{x} - \\dfrac{2}{x}\\).", "\\(\\dfrac{3}{x}\\).", "Same denominator."),
  W("Alice paints 1 room in \\(x\\) hours, Bob in \\(2x\\) hours. Combined rate per hour?", "\\(\\dfrac{3}{2x}\\).", "\\(\\frac{1}{x} + \\frac{1}{2x} = \\frac{3}{2x}\\).")
]);
_addQ('algebra', 'b4', 6, [
  R("Solve \\(\\dfrac{2}{x} + \\dfrac{1}{x} = 3\\).", "\\(x = 1\\).", "\\(\\frac{3}{x} = 3\\)."),
  W("One pipe fills a tank in 4 hrs, another in 6 hrs. Equation for combined time \\(t\\)?", "\\(\\dfrac{1}{4} + \\dfrac{1}{6} = \\dfrac{1}{t}\\).", "Rates add.")
]);
_addQ('algebra', 'b4', 7, [
  R("Why check solutions in the original equation?", "A solution might make a denominator zero.", "Extraneous solutions."),
  W("Solve \\(\\dfrac{1}{x-3} = \\dfrac{1}{x-3} + 2\\). Is there a solution?", "No solution.", "Subtracting gives \\(0 = 2\\).")
]);
_setCum('algebra', 'b4', {
  title: "Cumulative Test — Rational Expressions",
  questions: [
    R("Simplify \\(\\dfrac{x^2 - 25}{x - 5}\\).", "\\(x + 5\\), \\(x \\ne 5\\).", "Difference of squares."),
    R("Multiply \\(\\dfrac{2}{x+1} \\cdot \\dfrac{x+1}{6}\\).", "\\(\\dfrac{1}{3}\\).", "Cancel \\((x+1)\\) and reduce."),
    R("Add \\(\\dfrac{2}{x} + \\dfrac{3}{x+1}\\).", "\\(\\dfrac{5x+2}{x(x+1)}\\).", "Common denominator."),
    R("Solve \\(\\dfrac{1}{x} = \\dfrac{2}{x+3}\\).", "\\(x = 3\\).", "Cross multiply."),
    W("Two painters together finish in 4 hrs; one alone takes \\(x\\), the other \\(x+2\\). Equation?", "\\(\\dfrac{1}{x} + \\dfrac{1}{x+2} = \\dfrac{1}{4}\\).", "Rates sum."),
    R("For what \\(x\\) is \\(\\dfrac{x+1}{x^2 - 1}\\) undefined?", "\\(x = \\pm 1\\).", "Denominator 0.")
  ]
});

// Book 5: Systems
_addQ('algebra', 'b5', 0, [
  R("Solve by substitution: \\(y = x + 1,\\ 2x + y = 10\\).", "\\((3, 4)\\).", "\\(2x + x + 1 = 10 \\Rightarrow x = 3\\)."),
  W("A number plus twice another is 17, and the first minus the second is 5. Find both.", "\\(9\\) and \\(4\\).", "\\(x + 2y = 17,\\ x - y = 5\\).")
]);
_addQ('algebra', 'b5', 1, [
  R("5 books + 3 pens = $49; 2 books + 1 pen = $19. Book price?", "$8.", "Elim: \\(5b+3p=49,\\ 6b+3p=57\\); \\(b=8\\)."),
  W("A boat trip downstream takes 3 hrs, return 5 hrs, for 30 miles each way. Boat speed?", "8 mph.", "\\((b+c)3 = 30,\\ (b-c)5 = 30\\); \\(b=8,c=2\\).")
]);
_addQ('algebra', 'b5', 2, [
  R("Graph of \\(y > x\\) and \\(y < 4\\) — describe the region.", "Strip between \\(y = x\\) and \\(y = 4\\) where both hold.", "Intersection of half-planes."),
  W("A student earns \\($8\\)/hr at Job A and \\($10\\)/hr at Job B, working at most 15 hrs total, wanting at least $100. Set up.", "\\(a + b \\le 15,\\ 8a + 10b \\ge 100,\\ a, b \\ge 0\\).", "Constraints from each rule.")
]);
_addQ('algebra', 'b5', 3, [
  R("Solve \\(y = x^2 - 1,\\ y = 3\\).", "\\((\\pm 2, 3)\\).", "\\(x^2 = 4\\)."),
  W("A circle \\(x^2 + y^2 = 100\\) and line \\(y = 6\\) meet where?", "\\((\\pm 8, 6)\\).", "\\(x^2 = 64\\).")
]);
_addQ('algebra', 'b5', 4, [
  R("Solve: \\(x + y + z = 6,\\ y + z = 4,\\ z = 2\\).", "\\((2, 2, 2)\\).", "Back-sub: \\(z=2, y=2, x=2\\)."),
  W("Tickets: adult, student, child cost $12, $8, $5. 20 people paid $180; adults = students + children combined; 6 adults. Set up (no need to solve).", "\\(a=10? ...\\) — setup: \\(a+s+c=20,\\ 12a+8s+5c=180,\\ a = s + c\\).", "Translate each condition.")
]);
_addQ('algebra', 'b5', 5, [
  R("Find the parabola through \\((0, 0), (1, 1), (2, 4)\\).", "\\(y = x^2\\).", "Passes through these; solve system."),
  W("Data: \\(t = 0, 1, 2\\) gives \\(h = 4, 9, 16\\). Write quadratic \\(h(t)\\).", "\\(h(t) = 2t^2 + 3t + 4\\).", "Solve 3 equations for \\(a, b, c\\).")
]);
_setCum('algebra', 'b5', {
  title: "Cumulative Test — Systems",
  questions: [
    R("Solve \\(x + y = 10,\\ x - y = 4\\).", "\\((7, 3)\\).", "Add equations."),
    R("Solve by substitution \\(y = 2x,\\ x + y = 9\\).", "\\((3, 6)\\).", "Sub \\(y = 2x\\)."),
    R("Is \\((1, 3)\\) in the system \\(y > x, y < 4\\)?", "Yes.", "\\(3 > 1\\) and \\(3 < 4\\)."),
    W("A vending machine sells chips $1 and drinks $2; 50 items for $80. How many chips?", "20 chips, 30 drinks.", "\\(c+d=50,\\ c+2d=80\\); \\(d=30,c=20\\)."),
    R("Solve \\(y = x^2,\\ y = x\\).", "\\((0, 0)\\) and \\((1, 1)\\).", "\\(x^2 = x\\)."),
    W("Sum of three numbers is 12. Second is twice the first, third is three times the first. Find them.", "\\(2, 4, 6\\).", "\\(x + 2x + 3x = 12\\).")
  ]
});

// Book 6: Radicals
_addQ('algebra', 'b6', 0, [
  R("Evaluate \\(8^{2/3}\\).", "4.", "\\((\\sqrt[3]{8})^2 = 4\\)."),
  W("A cube's volume is 125. Side length?", "5.", "\\(\\sqrt[3]{125} = 5\\).")
]);
_addQ('algebra', 'b6', 1, [
  R("Is \\(\\pi\\) rational?", "No.", "Non-terminating, non-repeating."),
  W("Can the exact diagonal of a 3x3 square be written as a fraction?", "No — it's \\(3\\sqrt{2}\\), irrational.", "\\(\\sqrt{2}\\) is irrational.")
]);
_addQ('algebra', 'b6', 2, [
  R("Simplify \\(\\sqrt{45}\\).", "\\(3\\sqrt{5}\\).", "\\(\\sqrt{9 \\cdot 5}\\)."),
  W("Simplify \\(\\sqrt{200}\\).", "\\(10\\sqrt{2}\\).", "\\(\\sqrt{100 \\cdot 2}\\).")
]);
_addQ('algebra', 'b6', 3, [
  R("Solve \\(\\sqrt{2x + 1} = 5\\).", "\\(x = 12\\).", "Square: \\(2x + 1 = 25\\)."),
  W("Falling-time formula \\(t = \\sqrt{h/16}\\). Find \\(h\\) when \\(t = 3\\).", "144 ft.", "\\(3 = \\sqrt{h/16} \\Rightarrow h = 144\\).")
]);
_addQ('algebra', 'b6', 4, [
  R("Multiply \\((3\\sqrt{2})(\\sqrt{8})\\).", "12.", "\\(3\\sqrt{16} = 12\\)."),
  W("Rectangle has length \\(\\sqrt{12}\\) and width \\(\\sqrt{27}\\). Area?", "18.", "\\(\\sqrt{324} = 18\\).")
]);
_addQ('algebra', 'b6', 5, [
  R("Simplify \\(4\\sqrt{3} + 2\\sqrt{3}\\).", "\\(6\\sqrt{3}\\).", "Combine like terms."),
  W("Two pipes: \\(\\sqrt{75}\\) and \\(\\sqrt{27}\\) ft long. Total?", "\\(8\\sqrt{3}\\) ft.", "\\(5\\sqrt{3} + 3\\sqrt{3}\\).")
]);
_addQ('algebra', 'b6', 6, [
  R("Expand \\((\\sqrt{2} + 3)(\\sqrt{2} - 3)\\).", "\\(-7\\).", "\\(2 - 9\\)."),
  W("A rectangle has sides \\(\\sqrt{7} + 2\\) and \\(\\sqrt{7} - 2\\). Area?", "3.", "\\(7 - 4 = 3\\).")
]);
_addQ('algebra', 'b6', 7, [
  R("Simplify \\(\\sqrt{\\dfrac{25}{49}}\\).", "\\(\\tfrac{5}{7}\\).", "Split the radical."),
  W("A square has area \\(\\tfrac{9}{16}\\). Side length?", "\\(\\tfrac{3}{4}\\).", "Square root each.")
]);
_addQ('algebra', 'b6', 8, [
  R("Rationalize \\(\\dfrac{5}{\\sqrt{3}}\\).", "\\(\\dfrac{5\\sqrt{3}}{3}\\).", "Multiply by \\(\\sqrt{3}/\\sqrt{3}\\)."),
  W("Why rationalize denominators?", "Standard form; simpler comparison and computation.", "Historical convention.")
]);
_addQ('algebra', 'b6', 9, [
  R("Find hypotenuse if legs are 7 and 24.", "25.", "\\(\\sqrt{49 + 576} = 25\\)."),
  W("A TV diagonal is 50 in. and width 40 in. Find height.", "30 in.", "\\(\\sqrt{2500 - 1600} = 30\\).")
]);
_setCum('algebra', 'b6', {
  title: "Cumulative Test — Radicals",
  questions: [
    R("Simplify \\(\\sqrt{80}\\).", "\\(4\\sqrt{5}\\).", "\\(\\sqrt{16 \\cdot 5}\\)."),
    R("Rationalize \\(\\dfrac{2}{\\sqrt{5}}\\).", "\\(\\dfrac{2\\sqrt{5}}{5}\\).", "Multiply by \\(\\sqrt{5}/\\sqrt{5}\\)."),
    R("Simplify \\(3\\sqrt{2} - \\sqrt{8}\\).", "\\(\\sqrt{2}\\).", "\\(3\\sqrt{2} - 2\\sqrt{2}\\)."),
    R("Solve \\(\\sqrt{x+4} = 6\\).", "\\(x = 32\\).", "Square both sides."),
    W("Ladder 17 ft, base 8 ft from wall. How high?", "15 ft.", "\\(\\sqrt{289-64} = 15\\)."),
    W("Evaluate \\(16^{3/4}\\).", "8.", "\\((\\sqrt[4]{16})^3 = 2^3 = 8\\)."),
    R("Expand \\(\\sqrt{2}(\\sqrt{8} + \\sqrt{18})\\).", "\\(4 + 6 = 10\\).", "\\(\\sqrt{16} + \\sqrt{36}\\).")
  ]
});

/* ============ GEOMETRY ============ */

// g1: Basics
_addQ('geometry', 'g1', 0, [
  R("How many planes can pass through a single line?", "Infinitely many.", "A line lies in infinitely many planes."),
  W("Three non-collinear points are marked on a table. How many planes contain all three?", "Exactly one.", "Three non-collinear points determine a unique plane.")
]);
_addQ('geometry', 'g1', 1, [
  R("Midpoint of segment from \\((-3, 5)\\) to \\((7, -1)\\)?", "\\((2, 2)\\).", "Average coords."),
  W("The midpoint of a stick from \\((0, 0)\\) to \\((10, 24)\\) is where?", "\\((5, 12)\\).", "Average the coordinates.")
]);
_addQ('geometry', 'g1', 2, [
  R("Two angles are supplementary. One is \\(123°\\). Find the other.", "\\(57°\\).", "Sum is \\(180°\\)."),
  W("A clock's minute hand moves from 12 to 3. Angle swept?", "\\(90°\\).", "Quarter of \\(360°\\).")
]);
_setCum('geometry', 'g1', {
  title: "Cumulative Test — Basics of Geometry",
  questions: [
    R("Intersection of two distinct lines?", "A single point (or none if parallel).", "Two lines meet at most at one point."),
    R("Find the midpoint of \\((1, 2)\\) and \\((7, 10)\\).", "\\((4, 6)\\).", "Average."),
    R("Distance from \\((0, 0)\\) to \\((6, 8)\\)?", "10.", "\\(\\sqrt{36+64}\\)."),
    R("If two angles are complementary and one is \\(34°\\), the other is?", "\\(56°\\).", "Sum to \\(90°\\)."),
    W("A straight road turns \\(145°\\) at an intersection. What's the supplementary angle?", "\\(35°\\).", "\\(180 - 145\\)."),
    W("A clock's hands form a straight line. Angle between them?", "\\(180°\\).", "Straight angle.")
  ]
});

// g2: Parallel & Perpendicular
_addQ('geometry', 'g2', 0, [
  R("Corresponding angles on parallel lines are _____.", "Congruent.", "By the corresponding angles postulate."),
  W("Parallel train tracks cut by a road make a \\(58°\\) angle on one track. What's the corresponding angle on the other?", "\\(58°\\).", "Corresponding angles are equal.")
]);
_addQ('geometry', 'g2', 1, [
  R("Slope of a line perpendicular to one with slope \\(4\\)?", "\\(-\\tfrac{1}{4}\\).", "Negative reciprocal."),
  W("A roof beam has slope \\(\\tfrac{2}{3}\\). A perpendicular support beam has what slope?", "\\(-\\tfrac{3}{2}\\).", "Flip and negate.")
]);
_addQ('geometry', 'g2', 2, [
  R("If vertical angles are \\(70°\\), are the two lines parallel?", "Insufficient info; vertical angles don't prove parallel.", "Need corresponding / alternate interior / co-interior match."),
  W("A fence has two boards cut by a post; co-interior angles are \\(95°\\) and \\(85°\\). Are the boards parallel?", "Yes.", "They sum to \\(180°\\).")
]);
_setCum('geometry', 'g2', {
  title: "Cumulative Test — Parallel & Perpendicular Lines",
  questions: [
    R("Alternate exterior angles on parallel lines are _____.", "Congruent.", "By theorem."),
    R("Slope of a line parallel to \\(y = -2x + 3\\)?", "\\(-2\\).", "Same slope."),
    R("Parallel lines have slopes related how?", "Equal.", "Same slope."),
    R("Perpendicular lines have slopes with what product?", "\\(-1\\).", "Negative reciprocals."),
    W("A crossbeam cuts two lines making alternate interior angles \\(110°\\) and \\(110°\\). Parallel?", "Yes.", "Congruent alternate interior."),
    W("A line has slope \\(0\\). What's the slope of a line perpendicular to it?", "Undefined (vertical).", "Perpendicular to horizontal is vertical.")
  ]
});

// g3: Transformations
_addQ('geometry', 'g3', 0, [
  R("Reflect \\((-4, 7)\\) over the y-axis.", "\\((4, 7)\\).", "Negate \\(x\\)."),
  W("A logo at \\((2, -3)\\) is translated \\(\\langle -5, 4 \\rangle\\). New position?", "\\((-3, 1)\\).", "Add vector.")
]);
_addQ('geometry', 'g3', 1, [
  R("Rotate \\((0, 3)\\) by \\(270°\\) CCW about the origin.", "\\((3, 0)\\).", "\\(270°\\) CCW: \\((x, y) \\to (y, -x)\\)."),
  W("A star at \\((-1, 2)\\) is rotated \\(180°\\). Where is it?", "\\((1, -2)\\).", "\\((-x, -y)\\).")
]);
_addQ('geometry', 'g3', 2, [
  R("Dilate \\((6, -4)\\) by \\(\\tfrac{1}{2}\\) about origin.", "\\((3, -2)\\).", "Multiply by \\(1/2\\)."),
  W("A \\(5\\times 7\\) photo is scaled by factor \\(2.5\\). New size?", "\\(12.5 \\times 17.5\\).", "Multiply both sides.")
]);
_setCum('geometry', 'g3', {
  title: "Cumulative Test — Transformations",
  questions: [
    R("Translate \\((1, 1)\\) by \\(\\langle 3, -2 \\rangle\\).", "\\((4, -1)\\).", "Add vector."),
    R("Reflect \\((2, 5)\\) over the x-axis.", "\\((2, -5)\\).", "Negate \\(y\\)."),
    R("Rotate \\((4, 0)\\) by \\(90°\\) CCW.", "\\((0, 4)\\).", "\\((-y, x)\\)."),
    R("Dilate \\((2, 3)\\) by 5 about origin.", "\\((10, 15)\\).", "Multiply by 5."),
    W("A robot at \\((3, 4)\\) rotates \\(180°\\) about origin. Where?", "\\((-3, -4)\\).", "Negate both."),
    W("A model car is \\(\\tfrac{1}{20}\\) the real size. The real car is 200 in. long. Model length?", "10 in.", "Multiply by scale factor.")
  ]
});

// g4: Congruent Triangles
_addQ('geometry', 'g4', 0, [
  R("A triangle with angles \\(60°, 60°, 60°\\) is also called?", "Equilateral / equiangular.", "All angles equal → all sides equal."),
  W("Can a triangle have angles \\(90°, 90°, 0°\\)?", "No — sum must be \\(180°\\) and all angles positive.", "Degenerate.")
]);
_addQ('geometry', 'g4', 1, [
  R("Two triangles share two sides and the included angle. Congruent by?", "SAS.", "Side-Angle-Side."),
  W("Can AAA prove triangle congruence?", "No — it only proves similarity.", "Sides could differ proportionally.")
]);
_addQ('geometry', 'g4', 2, [
  R("Base angles of an isosceles triangle with vertex \\(80°\\)?", "\\(50°\\) each.", "\\((180 - 80)/2\\)."),
  W("An equilateral triangle's side is 6 cm. Perimeter?", "18 cm.", "\\(3 \\times 6\\).")
]);
_setCum('geometry', 'g4', {
  title: "Cumulative Test — Congruent Triangles",
  questions: [
    R("Triangle angles sum to?", "\\(180°\\).", "Triangle angle sum theorem."),
    R("A right scalene triangle has how many right angles?", "1.", "By definition."),
    R("Two triangles with 3 congruent sides each — congruent by?", "SSS.", "Side-Side-Side."),
    R("Base angles of isosceles with \\(40°\\) vertex?", "\\(70°\\) each.", "\\((180-40)/2\\)."),
    W("A triangle has two \\(55°\\) angles. Third angle?", "\\(70°\\).", "\\(180 - 110\\)."),
    W("Two triangles have two angles and the non-included side congruent. Postulate?", "AAS.", "Angle-Angle-Side.")
  ]
});

// g5: Quadrilaterals
_addQ('geometry', 'g5', 0, [
  R("Sum of interior angles of a 10-gon?", "\\(1440°\\).", "\\((10-2)(180)\\)."),
  W("A regular octagon has each interior angle measuring?", "\\(135°\\).", "\\(1080/8\\).")
]);
_addQ('geometry', 'g5', 1, [
  R("Consecutive angles in a parallelogram sum to?", "\\(180°\\).", "Co-interior on parallel sides."),
  W("In parallelogram \\(PQRS\\), \\(PQ = 8\\) cm. Find \\(SR\\).", "8 cm.", "Opposite sides congruent.")
]);
_addQ('geometry', 'g5', 2, [
  R("A rhombus's diagonals are also _____.", "Angle bisectors.", "Diagonals bisect the vertex angles."),
  W("A trapezoid has bases 6 and 10, legs both 5. Find the midsegment.", "8.", "\\((6+10)/2\\).")
]);
_setCum('geometry', 'g5', {
  title: "Cumulative Test — Quadrilaterals & Polygons",
  questions: [
    R("Interior angle sum of a heptagon?", "\\(900°\\).", "\\((7-2)(180)\\)."),
    R("Each exterior angle of a regular dodecagon?", "\\(30°\\).", "\\(360/12\\)."),
    R("Do diagonals of a rectangle bisect each other?", "Yes.", "Rectangles are parallelograms."),
    R("A rhombus with side 7 has perimeter?", "28.", "\\(4 \\times 7\\)."),
    W("A trapezoid with bases 4 and 12 has a midsegment of?", "8.", "Average."),
    W("In parallelogram \\(WXYZ\\), \\(\\angle W = 62°\\). Find \\(\\angle X\\).", "\\(118°\\).", "Consecutive angles sum to \\(180°\\).")
  ]
});

// g6: Similarity
_addQ('geometry', 'g6', 0, [
  R("Solve: \\(\\dfrac{x}{8} = \\dfrac{9}{12}\\).", "\\(x = 6\\).", "\\(12x = 72\\)."),
  W("A map uses scale 1 in = 50 mi. How many miles do 3.5 in represent?", "175 mi.", "\\(3.5 \\times 50\\).")
]);
_addQ('geometry', 'g6', 1, [
  R("Triangles with all angles equal are similar by?", "AA.", "Two equal angles force the third."),
  W("A 30-ft flagpole casts a 40-ft shadow. A nearby person's shadow is 8 ft. Height?", "6 ft.", "\\(\\frac{30}{40} = \\frac{h}{8}\\); \\(h = 6\\).")
]);
_addQ('geometry', 'g6', 2, [
  R("Scale factor 3 → volumes ratio?", "\\(1 : 27\\).", "Cubed scale factor."),
  W("Two similar squares have sides \\(4\\) and \\(10\\). Ratio of perimeters?", "\\(2 : 5\\).", "Same as side ratio.")
]);
_setCum('geometry', 'g6', {
  title: "Cumulative Test — Similarity",
  questions: [
    R("\\(\\dfrac{x}{5} = \\dfrac{4}{10}\\). Find \\(x\\).", "2.", "Cross multiply."),
    R("Two similar triangles: scale factor \\(3\\). Area ratio?", "\\(1 : 9\\).", "Squared."),
    R("Similar triangles share the same _____.", "Angle measures.", "Corresponding angles congruent."),
    R("AA similarity needs how many matching angles?", "2.", "Third is automatic."),
    W("A model train is 1:48 scale. A real 96-ft train would be how long as a model?", "2 ft.", "\\(96/48\\)."),
    W("Two similar rectangles: smaller has dimensions \\(3 \\times 5\\), larger has scale factor 4. Area of larger?", "\\(240\\) sq units.", "\\(15 \\times 16 = 240\\).")
  ]
});

// g7: Right Triangles & Trig
_addQ('geometry', 'g7', 0, [
  R("Pythagorean triple \\((a, b, c)\\) with \\(a = 5, b = 12\\)?", "\\(c = 13\\).", "\\(5, 12, 13\\)."),
  W("A diagonal of a \\(9 \\times 12\\) rectangle?", "15.", "\\(\\sqrt{81+144}=15\\).")
]);
_addQ('geometry', 'g7', 1, [
  R("Hypotenuse of 45-45-90 with leg 10?", "\\(10\\sqrt{2}\\).", "Multiply leg by \\(\\sqrt{2}\\)."),
  W("A 30-60-90 triangle has hypotenuse 20. Short leg?", "10.", "Hypotenuse / 2.")
]);
_addQ('geometry', 'g7', 2, [
  R("Find \\(\\cos\\theta\\) if adjacent = 8, hypotenuse = 10.", "\\(\\tfrac{4}{5}\\).", "\\(\\cos = \\text{adj}/\\text{hyp}\\)."),
  W("A ramp makes a \\(10°\\) angle with the ground. If length is 20 ft, height risen?", "\\(\\approx 3.47\\) ft.", "\\(20 \\sin 10° \\approx 3.47\\).")
]);
_setCum('geometry', 'g7', {
  title: "Cumulative Test — Right Triangles & Trigonometry",
  questions: [
    R("Leg if hypotenuse 25 and other leg 24?", "7.", "\\(\\sqrt{625-576}=7\\)."),
    R("Short leg in 30-60-90 with hypotenuse 14?", "7.", "Half of hypotenuse."),
    R("\\(\\sin\\theta\\) if opposite = 5, hypotenuse = 13?", "\\(\\tfrac{5}{13}\\).", "\\(\\text{opp}/\\text{hyp}\\)."),
    R("Diagonal of a square with side 6?", "\\(6\\sqrt{2}\\).", "side \\(\\times \\sqrt{2}\\)."),
    W("A ladder leans at \\(75°\\) with the ground, base 4 ft out. Approx. height up the wall?", "\\(\\approx 14.93\\) ft.", "\\(4\\tan 75° \\approx 14.93\\)."),
    W("Flagpole: from 60 ft away, angle of elevation to top is \\(35°\\). Height?", "\\(\\approx 42\\) ft.", "\\(60 \\tan 35° \\approx 42\\).")
  ]
});

// g8: Area, Surface Area, Volume
_addQ('geometry', 'g8', 0, [
  R("Area of a parallelogram with base 8 and height 5?", "40.", "\\(bh\\)."),
  W("A trapezoid has bases 6 and 10, height 4. Area?", "32.", "\\(\\tfrac{1}{2}(6+10)(4)\\).")
]);
_addQ('geometry', 'g8', 1, [
  R("Surface area of rectangular prism \\(2\\times 3\\times 4\\)?", "52.", "\\(2(2 \\cdot 3 + 3 \\cdot 4 + 2 \\cdot 4) = 52\\)."),
  W("A cone with radius 5 and slant height 13 has lateral surface area?", "\\(65\\pi\\).", "\\(\\pi r \\ell = 5 \\cdot 13 \\pi\\).")
]);
_addQ('geometry', 'g8', 2, [
  R("Volume of a cylinder with radius 4, height 10?", "\\(160\\pi\\).", "\\(\\pi r^2 h\\)."),
  W("An ice cream cone has radius 3 and height 9. Volume?", "\\(27\\pi\\).", "\\(\\tfrac{1}{3}\\pi r^2 h = \\tfrac{1}{3}\\pi(9)(9)\\).")
]);
_setCum('geometry', 'g8', {
  title: "Cumulative Test — Area, Surface Area & Volume",
  questions: [
    R("Area of circle radius 7?", "\\(49\\pi\\).", "\\(\\pi r^2\\)."),
    R("Area of a triangle base 12, height 5?", "30.", "\\(\\tfrac{1}{2}bh\\)."),
    R("Volume of cube with edge 4?", "64.", "\\(4^3\\)."),
    R("Surface area of sphere radius 5?", "\\(100\\pi\\).", "\\(4\\pi r^2\\)."),
    W("A cereal box is \\(8 \\times 3 \\times 12\\) in. Volume?", "288 cubic in.", "Multiply dimensions."),
    W("A cylindrical tank has radius 3 ft, height 10 ft. Approximate volume (use \\(\\pi = 3.14\\)).", "\\(\\approx 282.6\\) cu ft.", "\\(\\pi(9)(10) = 90\\pi \\approx 282.6\\).")
  ]
});

// g9: Probability
_addQ('geometry', 'g9', 0, [
  R("Probability of flipping tails on a fair coin?", "\\(\\tfrac{1}{2}\\).", "One favorable out of two."),
  W("A spinner has 8 equal regions: 3 red, 2 blue, 3 green. P(red)?", "\\(\\tfrac{3}{8}\\).", "3 of 8 outcomes.")
]);
_addQ('geometry', 'g9', 1, [
  R("Rolling two dice, probability of a 7?", "\\(\\tfrac{6}{36} = \\tfrac{1}{6}\\).", "6 ways out of 36."),
  W("Flip a coin and roll a die. Probability of heads AND a 3?", "\\(\\tfrac{1}{12}\\).", "\\(\\tfrac{1}{2} \\cdot \\tfrac{1}{6}\\).")
]);
_addQ('geometry', 'g9', 2, [
  R("\\(P(A) = 0.5\\), \\(P(A \\cap B) = 0.2\\). \\(P(B|A)\\)?", "0.4.", "\\(0.2/0.5\\)."),
  W("60% of students play a sport, 40% play soccer. 30% play both. Given plays sport, probability of soccer?", "0.5.", "\\(0.3/0.6\\).")
]);
_setCum('geometry', 'g9', {
  title: "Cumulative Test — Probability",
  questions: [
    R("Probability of getting heads on a fair coin?", "\\(\\tfrac{1}{2}\\).", "Basic."),
    R("Probability of drawing a king from a deck?", "\\(\\tfrac{4}{52} = \\tfrac{1}{13}\\).", "4 kings."),
    R("Two independent events, \\(P(A) = 0.2\\), \\(P(B) = 0.6\\). \\(P(A \\cap B)\\)?", "0.12.", "Multiply."),
    R("Mutually exclusive events \\(A, B\\): \\(P(A \\cap B)\\)?", "0.", "They can't both happen."),
    W("Bag of 5 red and 3 blue marbles. Drawing 2 without replacement, probability both red?", "\\(\\tfrac{5}{14}\\).", "\\(\\tfrac{5}{8} \\cdot \\tfrac{4}{7}\\)."),
    W("In a class, 80% pass math, 70% pass science, 60% pass both. Given passes math, probability passes science?", "0.75.", "\\(0.6/0.8\\).")
  ]
});

// g10: Circles
_addQ('geometry', 'g10', 0, [
  R("Area of a circle radius 10?", "\\(100\\pi\\).", "\\(\\pi r^2\\)."),
  W("A pizza has diameter 16 in. Area?", "\\(64\\pi\\) sq in.", "Radius 8, area \\(\\pi r^2\\).")
]);
_addQ('geometry', 'g10', 1, [
  R("Arc length for central angle \\(60°\\) in circle of radius 6?", "\\(2\\pi\\).", "\\((60/360)(2\\pi \\cdot 6)\\)."),
  W("A bike wheel of radius 12 in rotates through \\(180°\\). Arc length?", "\\(12\\pi\\) in.", "Half circumference.")
]);
_addQ('geometry', 'g10', 2, [
  R("Inscribed angle that intercepts a semicircle?", "\\(90°\\).", "Half of \\(180°\\)."),
  W("Two chords meet inside a circle creating arcs of \\(70°\\) and \\(130°\\). Angle formed?", "\\(100°\\).", "Half the sum of arcs.")
]);
_setCum('geometry', 'g10', {
  title: "Cumulative Test — Circles",
  questions: [
    R("Circumference of circle radius 9?", "\\(18\\pi\\).", "\\(2\\pi r\\)."),
    R("Central angle = \\(120°\\). Intercepted arc?", "\\(120°\\).", "Equal."),
    R("Inscribed angle intercepting arc of \\(100°\\)?", "\\(50°\\).", "Half."),
    R("Tangent meets radius at what angle?", "\\(90°\\).", "Always perpendicular."),
    W("A clock's minute hand traces a circle of radius 6 in. Arc length from 12 to 4?", "\\(4\\pi\\) in.", "\\(\\tfrac{4}{12}(12\\pi)\\)."),
    W("A pizza slice has central angle \\(40°\\) cut from a pizza of radius 9. Arc length of crust?", "\\(2\\pi\\) in.", "\\((40/360)(18\\pi) = 2\\pi\\).")
  ]
});

// Helper to append questions to an existing cumulative test (vs _setCum which replaces).
function _addCumQ(courseId, bookId, qs) {
  const b = COURSES[courseId].books.find(x => x.id === bookId);
  if (b && b.cumulativeTest) b.cumulativeTest.questions.push(...qs);
}

/* ============ RESCUE: hand-written top-ups for sections the API run kept choking on ============ */

// algebra b1 sec[3]: Domain and Range
_addQ('algebra', 'b1', 3, [
  R("Domain of \\(f(x) = 3x + 7\\)?", "All real numbers.", "Polynomial — defined everywhere."),
  R("Domain of \\(f(x) = \\dfrac{1}{x - 2}\\)?", "\\(x \\ne 2\\).", "Denominator can't be zero."),
  R("Range of \\(f(x) = x^2\\)?", "\\(y \\ge 0\\).", "Squares are non-negative."),
  R("Range of \\(f(x) = -x^2 + 4\\)?", "\\(y \\le 4\\).", "Parabola opens down, max at 4."),
  R("Domain of \\(f(x) = \\sqrt{x + 3}\\)?", "\\(x \\ge -3\\).", "Radicand must be \\(\\ge 0\\)."),
  R("Domain of \\(f(x) = \\dfrac{x + 1}{x^2 - 9}\\)?", "\\(x \\ne \\pm 3\\).", "Exclude zeros of denominator."),
  R("Range of \\(f(x) = |x| - 5\\)?", "\\(y \\ge -5\\).", "Min absolute value 0, shifted down 5."),
  R("Domain of \\(f(x) = \\sqrt{4 - x}\\)?", "\\(x \\le 4\\).", "\\(4 - x \\ge 0\\)."),
  R("Range of \\(f(x) = 5\\) (constant function)?", "\\(\\{5\\}\\).", "Always equals 5."),
  R("Domain and range of \\(f(x) = \\sqrt{x}\\)?", "Domain \\(x \\ge 0\\); range \\(y \\ge 0\\).", "Both restricted to non-negatives."),
  R("Domain of \\(f(x) = \\dfrac{\\sqrt{x}}{x - 4}\\)?", "\\(x \\ge 0,\\ x \\ne 4\\).", "Combine both restrictions."),
  W("A factory makes between 0 and 500 units a day; revenue is \\(R = 12n\\). State the domain and range.", "Domain \\(0 \\le n \\le 500\\); range \\(0 \\le R \\le 6000\\).", "Plug endpoints into \\(R = 12n\\)."),
  W("A drone flies for at most 30 minutes; altitude \\(A = 50t\\) ft. Domain and range?", "Domain \\(0 \\le t \\le 30\\); range \\(0 \\le A \\le 1500\\).", "Endpoints give range."),
  W("A pool holds 0 to 200 gallons of water. \\(V\\) is volume. What is a reasonable range?", "\\(0 \\le V \\le 200\\).", "Physical limits of the pool."),
  W("Cell phone plan: pay $20 per GB up to 50 GB. State the domain and range of cost.", "Domain \\(0 \\le g \\le 50\\); range \\(0 \\le C \\le 1000\\).", "Plug endpoints into \\(C = 20g\\).")
]);
_addCumQ('algebra', 'b1', [
  R("Is \\(\\{(1,2),(2,4),(1,5)\\}\\) a function?", "No.", "Input 1 maps to two outputs."),
  R("If \\(f(x) = 2x^2 - 1\\), find \\(f(3)\\).", "17.", "\\(2(9) - 1\\)."),
  R("If \\(g(x) = x + 4\\), find \\(g(-2)\\).", "2.", "\\(-2 + 4\\)."),
  R("Domain of \\(f(x) = \\dfrac{2}{x - 7}\\)?", "\\(x \\ne 7\\).", "Denominator nonzero."),
  R("Domain of \\(f(x) = \\sqrt{x + 5}\\)?", "\\(x \\ge -5\\).", "Radicand \\(\\ge 0\\)."),
  R("Range of \\(f(x) = x^2 + 3\\)?", "\\(y \\ge 3\\).", "Min at \\(x = 0\\)."),
  R("Range of \\(f(x) = -|x|\\)?", "\\(y \\le 0\\).", "Absolute value is non-negative; negate it."),
  R("Where is \\(f(x) = (x-2)^2\\) increasing?", "\\((2, \\infty)\\).", "Right of vertex."),
  R("Vertical-line test: does a circle define \\(y\\) as a function of \\(x\\)?", "No.", "Vertical line through interior hits twice."),
  R("Independent variable in \\(d = 60t\\)?", "\\(t\\).", "We choose time; distance reacts."),
  R("If \\(f(x) = 3x - 1\\), solve \\(f(x) = 14\\).", "\\(x = 5\\).", "\\(3x = 15\\)."),
  R("Find \\(f(0)\\) for \\(f(x) = x^3 - 2x + 4\\).", "4.", "Plug \\(x = 0\\)."),
  R("On what interval does \\(f(x) = -x + 1\\) decrease?", "All real numbers.", "Negative slope."),
  R("Is \\(y = 7\\) a function of \\(x\\)?", "Yes.", "Each \\(x\\) gives one \\(y\\)."),
  R("Range of \\(f(x) = |x| + 2\\)?", "\\(y \\ge 2\\).", "Min at \\(x = 0\\)."),
  W("A taxi charges $3 base + $2/mi. Cost function?", "\\(C(m) = 2m + 3\\).", "Fixed + per-mile."),
  W("Worker earns $15/hr up to 8 hr/day. Domain and range?", "Domain \\(0 \\le h \\le 8\\); range \\(0 \\le E \\le 120\\).", "Endpoints into \\(E = 15h\\)."),
  W("Population doubles every year: \\(P(t) = 100 \\cdot 2^t\\). Find \\(P(3)\\).", "800.", "\\(100 \\cdot 8\\)."),
  W("Plane climbs at 200 ft/min for 10 min then levels. Describe phases.", "Increasing then constant.", "Climb = increasing; level = constant."),
  W("Box volume \\(V(x) = x(10 - 2x)^2\\) with \\(0 < x < 5\\). State the domain.", "\\(0 < x < 5\\).", "Physical constraint."),
  W("A printer's pages \\(p(t) = 25t\\). Pages in 12 minutes?", "300.", "Multiply."),
  W("Phone bill: $30 + $0.10/min. Cost at 200 min?", "$50.", "\\(30 + 20\\)."),
  W("A balloon's altitude \\(A(t) = 1000 - 5t^2\\) for \\(t \\ge 0\\). When does it hit ground?", "\\(t = \\sqrt{200} \\approx 14.14\\) s.", "Set \\(A = 0\\)."),
  W("If demand \\(D(p) = 500 - 10p\\), domain making sense?", "\\(0 \\le p \\le 50\\).", "Demand non-negative.")
]);

// algebra b2 sec[1]: Slope
_addQ('algebra', 'b2', 1, [
  R("Slope through \\((0, 0)\\) and \\((4, 12)\\)?", "3.", "\\(12/4\\)."),
  R("Slope through \\((-1, 2)\\) and \\((3, 10)\\)?", "2.", "\\(8/4\\)."),
  R("Slope through \\((5, 3)\\) and \\((5, 9)\\)?", "Undefined.", "Vertical line."),
  R("Slope through \\((-4, 1)\\) and \\((6, 1)\\)?", "0.", "Horizontal."),
  R("Slope through \\((2, 7)\\) and \\((6, -1)\\)?", "\\(-2\\).", "\\((-1-7)/(6-2)\\)."),
  R("Slope of \\(y = -3x + 4\\)?", "\\(-3\\).", "Coefficient of \\(x\\)."),
  R("Slope of \\(y = \\dfrac{2}{5}x - 1\\)?", "\\(\\dfrac{2}{5}\\).", "Coefficient of \\(x\\)."),
  R("Two lines have slopes \\(\\dfrac{2}{3}\\) and \\(\\dfrac{2}{3}\\). Parallel?", "Yes.", "Same slope ⇒ parallel."),
  R("Slope perpendicular to \\(\\dfrac{3}{4}\\)?", "\\(-\\dfrac{4}{3}\\).", "Negative reciprocal."),
  R("Slope through \\((-2, -3)\\) and \\((4, 9)\\)?", "2.", "\\(12/6\\)."),
  R("Are lines \\(y = 2x + 1\\) and \\(y = -\\dfrac{1}{2}x + 4\\) perpendicular?", "Yes.", "Slopes are negative reciprocals."),
  W("A roof rises 6 ft over 18 ft of run. Slope?", "\\(\\dfrac{1}{3}\\).", "\\(6/18\\)."),
  W("A car travels 180 mi in 3 hr. Slope on a distance-time graph?", "60.", "mi/hr."),
  W("A tank drains 24 gallons in 8 minutes. Slope of volume-vs-time?", "\\(-3\\).", "\\(-24/8\\)."),
  W("From sea level a trail rises 250 ft in 1 mile (5280 ft horizontal). Slope?", "\\(\\dfrac{25}{528} \\approx 0.047\\).", "\\(250/5280\\).")
]);

// algebra b2 sec[4]: Point-Slope Form
_addQ('algebra', 'b2', 4, [
  R("Line through \\((1, 5)\\) with slope 3. Point-slope form?", "\\(y - 5 = 3(x - 1)\\).", "Plug into \\(y - y_1 = m(x - x_1)\\)."),
  R("Line through \\((-2, 4)\\) with slope \\(-1\\). Point-slope form?", "\\(y - 4 = -1(x + 2)\\).", "Plug in values."),
  R("Through \\((0, 7)\\) with slope 2 — point-slope form?", "\\(y - 7 = 2(x - 0)\\) or \\(y = 2x + 7\\).", "Convert if needed."),
  R("Convert \\(y - 3 = 4(x + 1)\\) to slope-intercept form.", "\\(y = 4x + 7\\).", "Distribute and add 3."),
  R("Convert \\(y + 2 = -3(x - 5)\\) to slope-intercept form.", "\\(y = -3x + 13\\).", "Distribute and subtract 2."),
  R("Slope of \\(y - 1 = \\dfrac{1}{2}(x - 6)\\)?", "\\(\\dfrac{1}{2}\\).", "Coefficient of \\((x - 6)\\)."),
  R("Through \\((2, -3)\\) and \\((5, 9)\\) in point-slope form?", "\\(y - 9 = 4(x - 5)\\) or \\(y + 3 = 4(x - 2)\\).", "Slope \\(12/3 = 4\\)."),
  R("Through \\((-1, -1)\\) and \\((3, 7)\\) in point-slope form?", "\\(y - 7 = 2(x - 3)\\).", "Slope \\(8/4 = 2\\)."),
  R("Line parallel to \\(y = 5x - 2\\) through \\((1, 4)\\) in point-slope form?", "\\(y - 4 = 5(x - 1)\\).", "Same slope."),
  R("Line perpendicular to \\(y = 2x + 3\\) through \\((4, 1)\\) in point-slope form?", "\\(y - 1 = -\\dfrac{1}{2}(x - 4)\\).", "Negative reciprocal."),
  R("Convert \\(y - 5 = -2(x + 3)\\) to standard form.", "\\(2x + y = -1\\).", "Distribute: \\(y = -2x - 6 + 5\\); rearrange."),
  W("A candle is 10 in. at \\(t = 0\\) and burns 0.5 in./hr. Write \\(h(t)\\) in point-slope form.", "\\(h - 10 = -0.5(t - 0)\\).", "Slope is burn rate."),
  W("A tank has 50 gal at minute 2 and 30 gal at minute 12. Write \\(V(t)\\) in point-slope form.", "\\(V - 50 = -2(t - 2)\\).", "Slope \\((30-50)/(12-2) = -2\\)."),
  W("A plant is 3 cm at week 1 and 11 cm at week 5. Equation in point-slope form?", "\\(h - 3 = 2(w - 1)\\).", "Slope \\(8/4 = 2\\)."),
  W("Earnings: $40 at hour 2 and $100 at hour 8. Point-slope form?", "\\(E - 40 = 10(h - 2)\\).", "Slope \\(60/6 = 10\\).")
]);

// precalc pc4 sec[0]: Pythagorean and Reciprocal Identities
_addQ('precalc', 'pc4', 0, [
  R("Simplify \\(1 - \\cos^2 x\\).", "\\(\\sin^2 x\\).", "Pythagorean identity."),
  R("Simplify \\(\\csc^2 x - \\cot^2 x\\).", "1.", "Pythagorean identity."),
  R("Simplify \\(\\tan x \\cos x\\).", "\\(\\sin x\\).", "\\(\\tan = \\sin/\\cos\\)."),
  R("Simplify \\(\\cot x \\sin x\\).", "\\(\\cos x\\).", "\\(\\cot = \\cos/\\sin\\)."),
  R("If \\(\\cos\\theta = \\dfrac{3}{5}\\) in QI, find \\(\\sin\\theta\\).", "\\(\\dfrac{4}{5}\\).", "\\(\\sin^2 = 1 - 9/25 = 16/25\\)."),
  R("If \\(\\sin\\theta = -\\dfrac{5}{13}\\) in QIII, find \\(\\cos\\theta\\).", "\\(-\\dfrac{12}{13}\\).", "QIII cosine is negative."),
  R("If \\(\\tan\\theta = \\dfrac{1}{2}\\) in QI, find \\(\\sec\\theta\\).", "\\(\\dfrac{\\sqrt{5}}{2}\\).", "\\(\\sec^2 = 1 + 1/4 = 5/4\\)."),
  R("Simplify \\(\\sec\\theta \\cos\\theta\\).", "1.", "Reciprocals."),
  R("Simplify \\(\\dfrac{\\sin^2\\theta}{1 - \\cos\\theta}\\).", "\\(1 + \\cos\\theta\\).", "\\(\\sin^2 = (1-\\cos)(1+\\cos)\\); cancel."),
  R("Verify: \\(\\sin\\theta \\sec\\theta = \\tan\\theta\\).", "True.", "\\(\\sin \\cdot 1/\\cos = \\tan\\)."),
  R("Simplify \\(\\cot^2 x + 1\\).", "\\(\\csc^2 x\\).", "Pythagorean identity."),
  W("A right triangle has \\(\\sin\\theta = \\dfrac{7}{25}\\). Find \\(\\cos\\theta\\) (QI).", "\\(\\dfrac{24}{25}\\).", "\\(\\cos^2 = 1 - 49/625\\)."),
  W("If \\(\\sec\\theta = 2\\), find \\(\\cos\\theta\\).", "\\(\\dfrac{1}{2}\\).", "Reciprocal."),
  W("Show \\(\\dfrac{1}{\\sin\\theta} = \\csc\\theta\\) directly from definitions.", "True by definition of \\(\\csc\\).", "Reciprocal of sine."),
  W("If \\(\\cos\\theta = -\\dfrac{1}{2}\\) and \\(\\theta\\) in QII, find \\(\\tan\\theta\\).", "\\(-\\sqrt{3}\\).", "\\(\\sin = \\sqrt{3}/2\\); \\(\\tan = \\sin/\\cos\\).")
]);

// precalc pc4 sec[1]: Sum and Difference Formulas
_addQ('precalc', 'pc4', 1, [
  R("\\(\\sin(A - B)\\)?", "\\(\\sin A \\cos B - \\cos A \\sin B\\).", "Difference formula for sine."),
  R("\\(\\cos(A + B)\\)?", "\\(\\cos A \\cos B - \\sin A \\sin B\\).", "Sum formula for cosine."),
  R("\\(\\tan(A + B)\\)?", "\\(\\dfrac{\\tan A + \\tan B}{1 - \\tan A \\tan B}\\).", "Standard formula."),
  R("\\(\\tan(A - B)\\)?", "\\(\\dfrac{\\tan A - \\tan B}{1 + \\tan A \\tan B}\\).", "Standard formula."),
  R("Find \\(\\cos(75°)\\) using \\(45° + 30°\\).", "\\(\\dfrac{\\sqrt{6} - \\sqrt{2}}{4}\\).", "\\(\\cos45\\cos30 - \\sin45\\sin30\\)."),
  R("Find \\(\\sin(15°)\\) using \\(45° - 30°\\).", "\\(\\dfrac{\\sqrt{6} - \\sqrt{2}}{4}\\).", "\\(\\sin45\\cos30 - \\cos45\\sin30\\)."),
  R("Find \\(\\sin(105°)\\) using \\(60° + 45°\\).", "\\(\\dfrac{\\sqrt{6} + \\sqrt{2}}{4}\\).", "Sum formula."),
  R("Find \\(\\cos(105°)\\) using \\(60° + 45°\\).", "\\(\\dfrac{\\sqrt{2} - \\sqrt{6}}{4}\\).", "Sum formula."),
  R("Find \\(\\tan(15°)\\) using \\(45° - 30°\\).", "\\(2 - \\sqrt{3}\\).", "Apply tan-difference formula."),
  R("Simplify \\(\\sin(x + \\pi)\\).", "\\(-\\sin x\\).", "\\(\\sin x \\cos\\pi + \\cos x \\sin\\pi = -\\sin x\\)."),
  R("Simplify \\(\\cos(x - \\pi/2)\\).", "\\(\\sin x\\).", "Co-function identity."),
  W("Two angles sum to \\(45°\\); one is \\(30°\\). Find \\(\\sin\\) of the other (\\(15°\\)).", "\\(\\dfrac{\\sqrt{6} - \\sqrt{2}}{4}\\).", "Use difference formula."),
  W("If \\(\\sin A = 3/5\\), \\(\\cos B = 12/13\\) (both QI), find \\(\\sin(A + B)\\).", "\\(\\dfrac{63}{65}\\).", "\\((3/5)(12/13) + (4/5)(5/13)\\)."),
  W("Verify \\(\\sin(180° - x) = \\sin x\\).", "True.", "\\(\\sin180\\cos x - \\cos180\\sin x = \\sin x\\)."),
  W("Use sum formula to express \\(\\cos(x + 60°)\\) in terms of \\(\\sin x\\) and \\(\\cos x\\).", "\\(\\tfrac{1}{2}\\cos x - \\tfrac{\\sqrt{3}}{2}\\sin x\\).", "\\(\\cos60 = 1/2\\), \\(\\sin60 = \\sqrt{3}/2\\).")
]);

// precalc pc4 sec[2]: Double-Angle Formulas
_addQ('precalc', 'pc4', 2, [
  R("If \\(\\sin\\theta = \\tfrac{4}{5}\\) (QI), find \\(\\cos(2\\theta)\\).", "\\(-\\dfrac{7}{25}\\).", "\\(1 - 2(16/25)\\)."),
  R("If \\(\\cos\\theta = \\tfrac{3}{5}\\) (QI), find \\(\\sin(2\\theta)\\).", "\\(\\dfrac{24}{25}\\).", "\\(2 \\cdot \\tfrac{4}{5} \\cdot \\tfrac{3}{5}\\)."),
  R("Simplify \\(2\\sin x \\cos x\\).", "\\(\\sin(2x)\\).", "Double-angle for sine."),
  R("Simplify \\(1 - 2\\sin^2 x\\).", "\\(\\cos(2x)\\).", "Double-angle form."),
  R("Simplify \\(2\\cos^2 x - 1\\).", "\\(\\cos(2x)\\).", "Double-angle form."),
  R("Find \\(\\sin(120°)\\) using \\(\\sin(2 \\cdot 60°)\\).", "\\(\\dfrac{\\sqrt{3}}{2}\\).", "\\(2\\sin60\\cos60 = 2(\\sqrt{3}/2)(1/2)\\)."),
  R("Find \\(\\cos(120°)\\) using \\(\\cos(2 \\cdot 60°)\\).", "\\(-\\dfrac{1}{2}\\).", "\\(2\\cos^2 60 - 1 = 2(1/4) - 1\\)."),
  R("If \\(\\tan\\theta = 1\\), find \\(\\tan(2\\theta)\\).", "Undefined.", "Denominator \\(1 - 1 = 0\\)."),
  R("If \\(\\sin\\theta = -\\tfrac{1}{2}\\) (QIII), find \\(\\sin(2\\theta)\\).", "\\(\\dfrac{\\sqrt{3}}{2}\\).", "\\(\\cos\\theta = -\\sqrt{3}/2\\); product positive."),
  R("Solve \\(\\sin(2x) = 0\\) for \\(0 \\le x < 2\\pi\\).", "\\(x = 0, \\pi/2, \\pi, 3\\pi/2\\).", "\\(2x = k\\pi\\)."),
  R("Solve \\(\\cos(2x) = 1\\) for \\(0 \\le x < 2\\pi\\).", "\\(x = 0, \\pi\\).", "\\(2x = 0, 2\\pi\\)."),
  W("If \\(\\sin\\theta = \\tfrac{12}{13}\\) (QII), find \\(\\sin(2\\theta)\\).", "\\(-\\dfrac{120}{169}\\).", "\\(\\cos\\theta = -5/13\\); product negative."),
  W("If \\(\\cos\\theta = \\tfrac{\\sqrt{2}}{2}\\) (QI), find \\(\\cos(2\\theta)\\).", "0.", "\\(2(1/2) - 1\\)."),
  W("Express \\(\\sin(4x)\\) using a double-angle identity.", "\\(2\\sin(2x)\\cos(2x)\\).", "Apply double-angle to \\(2(2x)\\)."),
  W("If \\(\\tan\\theta = \\tfrac{1}{2}\\), find \\(\\tan(2\\theta)\\).", "\\(\\dfrac{4}{3}\\).", "\\(\\dfrac{2(1/2)}{1 - 1/4} = \\dfrac{1}{3/4}\\).")
]);

/* ============ TRIGONOMETRY tr4 — hand-written top-up (expand tool kept failing) ============ */

// tr4 sec[0]: Pythagorean & Reciprocal Identities (+15)
_addQ('trigonometry', 'tr4', 0, [
  R("Simplify \\(1 - \\cos^2\\theta\\).", "\\(\\sin^2\\theta\\).", "Pythagorean."),
  R("Simplify \\(\\csc^2\\theta - \\cot^2\\theta\\).", "1.", "Pythagorean."),
  R("Simplify \\(\\cot\\theta\\sin\\theta\\).", "\\(\\cos\\theta\\).", "\\(\\tfrac{\\cos}{\\sin}\\cdot\\sin\\)."),
  R("If \\(\\cos\\theta = \\tfrac{4}{5}\\) in QI, find \\(\\sin\\theta\\).", "\\(\\tfrac{3}{5}\\).", "Pythagorean."),
  R("If \\(\\tan\\theta = \\tfrac{3}{4}\\) in QI, find \\(\\sec\\theta\\).", "\\(\\tfrac{5}{4}\\).", "\\(\\sec^2 = 1 + 9/16\\)."),
  R("Simplify \\(\\dfrac{\\sin\\theta}{\\cos\\theta}\\).", "\\(\\tan\\theta\\).", "Definition."),
  R("Simplify \\(\\cos\\theta\\sec\\theta\\).", "1.", "Reciprocals."),
  R("Simplify \\(\\sin\\theta\\cot\\theta\\).", "\\(\\cos\\theta\\).", "\\(\\sin\\cdot\\tfrac{\\cos}{\\sin}\\)."),
  R("If \\(\\sin\\theta = -\\tfrac{1}{2}\\) in QIII, find \\(\\cos\\theta\\).", "\\(-\\tfrac{\\sqrt{3}}{2}\\).", "Pythagorean; QIII negative."),
  R("Simplify \\(1 + \\cot^2\\theta\\).", "\\(\\csc^2\\theta\\).", "Pythagorean."),
  R("Simplify \\(\\sec\\theta - \\sec\\theta\\sin^2\\theta\\).", "\\(\\cos\\theta\\).", "Factor \\(\\sec(1-\\sin^2) = \\sec\\cos^2 = \\cos\\)."),
  W("Show \\(\\tan\\theta\\cos\\theta = \\sin\\theta\\).", "True.", "\\(\\tan = \\sin/\\cos\\)."),
  W("If \\(\\sec\\theta = 2\\), find \\(\\cos\\theta\\).", "\\(\\tfrac{1}{2}\\).", "Reciprocal."),
  W("Simplify \\(\\dfrac{1 - \\cos^2 x}{\\sin x}\\).", "\\(\\sin x\\).", "Numerator = \\(\\sin^2 x\\); cancel one."),
  W("If \\(\\sin\\theta = \\tfrac{7}{25}\\) (QI), find \\(\\cos\\theta\\).", "\\(\\tfrac{24}{25}\\).", "Pythagorean.")
]);

// tr4 sec[1]: Sum & Difference Formulas (+15)
_addQ('trigonometry', 'tr4', 1, [
  R("\\(\\sin(A - B) = ?\\)", "\\(\\sin A\\cos B - \\cos A\\sin B\\).", "Standard."),
  R("\\(\\cos(A + B) = ?\\)", "\\(\\cos A\\cos B - \\sin A\\sin B\\).", "Standard."),
  R("\\(\\tan(A+B) = ?\\)", "\\(\\dfrac{\\tan A + \\tan B}{1 - \\tan A\\tan B}\\).", "Standard."),
  R("Find \\(\\cos 75°\\) using \\(45° + 30°\\).", "\\(\\dfrac{\\sqrt{6} - \\sqrt{2}}{4}\\).", "Apply sum formula."),
  R("Find \\(\\sin 15°\\) using \\(45° - 30°\\).", "\\(\\dfrac{\\sqrt{6} - \\sqrt{2}}{4}\\).", "Apply difference formula."),
  R("Simplify \\(\\sin(x + 2\\pi)\\).", "\\(\\sin x\\).", "Periodic."),
  R("Simplify \\(\\cos(\\pi - x)\\).", "\\(-\\cos x\\).", "Difference formula."),
  R("\\(\\sin(\\pi/2 - x) = ?\\)", "\\(\\cos x\\).", "Co-function identity."),
  R("\\(\\cos(\\pi/2 - x) = ?\\)", "\\(\\sin x\\).", "Co-function identity."),
  R("Find \\(\\tan 75°\\) using \\(45° + 30°\\).", "\\(2 + \\sqrt{3}\\).", "Tan sum formula."),
  R("Find \\(\\tan 15°\\) using \\(45° - 30°\\).", "\\(2 - \\sqrt{3}\\).", "Tan difference formula."),
  W("If \\(\\sin A = \\tfrac{3}{5}\\) (QI), \\(\\cos B = \\tfrac{12}{13}\\) (QI), find \\(\\sin(A+B)\\).", "\\(\\tfrac{63}{65}\\).", "\\(\\sin A\\cos B + \\cos A\\sin B\\)."),
  W("Find \\(\\sin 105°\\) using \\(60° + 45°\\).", "\\(\\dfrac{\\sqrt{6}+\\sqrt{2}}{4}\\).", "Sum formula."),
  W("Verify \\(\\sin(180° - x) = \\sin x\\).", "True.", "Difference formula."),
  W("Express \\(\\cos(x + 60°)\\) using \\(\\sin x\\) and \\(\\cos x\\).", "\\(\\tfrac{1}{2}\\cos x - \\tfrac{\\sqrt{3}}{2}\\sin x\\).", "Sum formula.")
]);

// tr4 sec[2]: Double & Half Angle Formulas (+15)
_addQ('trigonometry', 'tr4', 2, [
  R("If \\(\\sin\\theta = \\tfrac{4}{5}\\) (QI), find \\(\\sin 2\\theta\\).", "\\(\\tfrac{24}{25}\\).", "\\(2 \\cdot \\tfrac{4}{5} \\cdot \\tfrac{3}{5}\\)."),
  R("If \\(\\cos\\theta = \\tfrac{3}{5}\\) (QI), find \\(\\cos 2\\theta\\).", "\\(-\\tfrac{7}{25}\\).", "\\(2(9/25) - 1\\)."),
  R("Simplify \\(2\\sin x\\cos x\\).", "\\(\\sin 2x\\).", "Double-angle."),
  R("Simplify \\(2\\cos^2 x - 1\\).", "\\(\\cos 2x\\).", "Double-angle form."),
  R("Simplify \\(1 - 2\\sin^2 x\\).", "\\(\\cos 2x\\).", "Double-angle form."),
  R("\\(\\tan(2\\theta) = ?\\)", "\\(\\dfrac{2\\tan\\theta}{1 - \\tan^2\\theta}\\).", "Standard."),
  R("Find \\(\\sin 120°\\) using \\(\\sin(2\\cdot 60°)\\).", "\\(\\tfrac{\\sqrt{3}}{2}\\).", "\\(2\\sin 60\\cos 60\\)."),
  R("Find \\(\\cos 120°\\) using double-angle.", "\\(-\\tfrac{1}{2}\\).", "\\(2(1/4) - 1\\)."),
  R("If \\(\\tan\\theta = 1\\), find \\(\\tan 2\\theta\\).", "Undefined.", "Denominator 0."),
  R("If \\(\\tan\\theta = \\tfrac{1}{2}\\), find \\(\\tan 2\\theta\\).", "\\(\\tfrac{4}{3}\\).", "\\(\\tfrac{1}{3/4}\\)."),
  R("Half-angle: \\(\\sin(\\theta/2) = ?\\)", "\\(\\pm\\sqrt{(1-\\cos\\theta)/2}\\).", "Standard."),
  W("Solve \\(\\sin 2x = 0\\) for \\(0 \\le x < 2\\pi\\).", "\\(x = 0, \\pi/2, \\pi, 3\\pi/2\\).", "\\(2x = k\\pi\\)."),
  W("Solve \\(\\cos 2x = 1\\) for \\(0 \\le x < 2\\pi\\).", "\\(x = 0, \\pi\\).", "\\(2x = 0, 2\\pi\\)."),
  W("If \\(\\sin\\theta = \\tfrac{12}{13}\\) (QII), find \\(\\sin 2\\theta\\).", "\\(-\\tfrac{120}{169}\\).", "\\(\\cos = -5/13\\); product negative."),
  W("Express \\(\\sin 4x\\) using double-angle.", "\\(2\\sin 2x\\cos 2x\\).", "Apply to \\(2(2x)\\).")
]);

// tr4 cum: Trig Identities cumulative test (+24)
_addCumQ('trigonometry', 'tr4', [
  R("Simplify \\(\\sin^2\\theta + \\cos^2\\theta\\).", "1.", "Pythagorean."),
  R("Simplify \\(1 + \\tan^2\\theta\\).", "\\(\\sec^2\\theta\\).", "Pythagorean."),
  R("Simplify \\(1 + \\cot^2\\theta\\).", "\\(\\csc^2\\theta\\).", "Pythagorean."),
  R("\\(\\sin(A + B) = ?\\)", "\\(\\sin A\\cos B + \\cos A\\sin B\\).", "Sum formula."),
  R("\\(\\cos(A - B) = ?\\)", "\\(\\cos A\\cos B + \\sin A\\sin B\\).", "Difference formula."),
  R("\\(\\sin 2\\theta = ?\\)", "\\(2\\sin\\theta\\cos\\theta\\).", "Double-angle."),
  R("\\(\\cos 2\\theta\\) (one form)?", "\\(\\cos^2\\theta - \\sin^2\\theta\\).", "Double-angle."),
  R("\\(\\tan 2\\theta = ?\\)", "\\(\\dfrac{2\\tan\\theta}{1 - \\tan^2\\theta}\\).", "Standard."),
  R("Simplify \\(\\tan\\theta\\cos\\theta\\).", "\\(\\sin\\theta\\).", "Definition of tangent."),
  R("Simplify \\(\\sec\\theta\\cos\\theta\\).", "1.", "Reciprocals."),
  R("Simplify \\(\\csc\\theta\\sin\\theta\\).", "1.", "Reciprocals."),
  R("Find \\(\\sin 75°\\) using sum formula with \\(45° + 30°\\).", "\\(\\dfrac{\\sqrt{6}+\\sqrt{2}}{4}\\).", "Apply sum formula."),
  R("Find \\(\\cos 15°\\) using \\(45° - 30°\\).", "\\(\\dfrac{\\sqrt{6}+\\sqrt{2}}{4}\\).", "Difference formula."),
  R("If \\(\\sin\\theta = \\tfrac{3}{5}\\) (QI), find \\(\\sin 2\\theta\\).", "\\(\\tfrac{24}{25}\\).", "Double-angle."),
  R("If \\(\\cos\\theta = \\tfrac{1}{2}\\) (QI), find \\(\\cos 2\\theta\\).", "\\(-\\tfrac{1}{2}\\).", "\\(2(1/4) - 1\\)."),
  R("Co-function: \\(\\sin(\\pi/2 - x) = ?\\)", "\\(\\cos x\\).", "Standard."),
  R("Simplify \\(\\sin(x + 2\\pi)\\).", "\\(\\sin x\\).", "Periodicity."),
  W("Verify \\(\\sin\\theta\\csc\\theta = 1\\).", "True.", "Reciprocals."),
  W("If \\(\\cos\\theta = -\\tfrac{1}{2}\\) (QII), find \\(\\sin\\theta\\).", "\\(\\tfrac{\\sqrt{3}}{2}\\).", "Pythagorean; QII positive."),
  W("Simplify \\(2\\sin 45°\\cos 45°\\).", "1.", "\\(= \\sin 90° = 1\\)."),
  W("If \\(\\tan\\theta = \\tfrac{1}{3}\\), find \\(\\tan 2\\theta\\).", "\\(\\tfrac{3}{4}\\).", "\\(\\tfrac{2/3}{1 - 1/9} = \\tfrac{2/3}{8/9}\\)."),
  W("Find \\(\\tan(45° + 30°)\\) using sum formula.", "\\(2 + \\sqrt{3}\\).", "Tan sum."),
  W("Solve \\(\\sin 2x = 1\\) for \\(0 \\le x < 2\\pi\\).", "\\(x = \\pi/4, 5\\pi/4\\).", "\\(2x = \\pi/2 + 2k\\pi\\)."),
  W("Express \\(\\cos(x + \\pi)\\) in terms of \\(\\cos x\\).", "\\(-\\cos x\\).", "Sum formula.")
]);

/* ============ PREALGEBRA — hand-written top-ups ============ */

// Round out p3, p4, p7 cumulative tests to 30 questions.
_addCumQ('prealgebra', 'p3', [
  R("\\(-12 + 5\\)?", "\\(-7\\).", "Larger absolute value is negative.")
]);
_addCumQ('prealgebra', 'p4', [
  R("Convert \\(\\dfrac{9}{4}\\) to a mixed number.", "\\(2\\dfrac{1}{4}\\).", "\\(9 = 2(4) + 1\\)."),
  R("\\(\\dfrac{2}{5} \\cdot \\dfrac{5}{6}\\)?", "\\(\\dfrac{1}{3}\\).", "Cancel and multiply.")
]);
_addCumQ('prealgebra', 'p7', [
  R("Name the property: \\(7 \\cdot 1 = 7\\).", "Multiplicative identity.", "1 is the identity for multiplication.")
]);


// p5: Decimals — cumulative test expansion
_addCumQ('prealgebra', 'p5', [
  R("Round 8.149 to the nearest hundredth.", "8.15.", "Thousandths digit 9 ≥ 5."),
  R("\\(3.6 - 1.27\\)?", "2.33.", "Line up: \\(3.60 - 1.27\\)."),
  R("\\(0.8 \\cdot 0.9\\)?", "0.72.", "\\(72\\) with two decimal places."),
  R("\\(12.5 \\div 2.5\\)?", "5.", "\\(125 \\div 25\\)."),
  R("Convert 0.6 to a fraction in simplest form.", "\\(\\dfrac{3}{5}\\).", "\\(\\dfrac{6}{10}\\) divides by 2."),
  R("Which is larger: 0.305 or 0.35?", "0.35.", "Compare: \\(0.350 > 0.305\\)."),
  R("Place value of the 4 in 9.0143?", "Thousandths.", "Third place right of the decimal."),
  R("Convert \\(\\dfrac{3}{4}\\) to a decimal.", "0.75.", "\\(3 \\div 4\\)."),
  R("\\(\\sqrt{64}\\)?", "8.", "\\(8^2 = 64\\)."),
  R("Approximate \\(\\sqrt{20}\\) to the nearest tenth.", "4.5.", "\\(4.5^2 = 20.25\\)."),
  R("\\(0.04 \\cdot 0.5\\)?", "0.02.", "\\(20\\) with three decimal places."),
  R("\\(9.5 + 0.075\\)?", "9.575.", "Line up: \\(9.500 + 0.075\\)."),
  R("Convert 1.25 to a mixed number.", "\\(1\\dfrac{1}{4}\\).", "\\(0.25 = \\dfrac{1}{4}\\)."),
  R("Order least to greatest: 0.5, 0.45, 0.504.", "0.45, 0.5, 0.504.", "Compare place by place."),
  R("\\(2.4 \\div 0.4\\)?", "6.", "Shift decimals."),
  W("A receipt shows 3 items at $1.49. Total before tax?", "$4.47.", "\\(3 \\cdot 1.49\\)."),
  W("You owe $30 and pay $14.80. Balance?", "$15.20.", "Subtract."),
  W("A board is 6.4 ft; cut into 4 equal pieces. Each piece?", "1.6 ft.", "\\(6.4 / 4\\)."),
  W("A runner's lap times: 62.5, 60.8, 61.2 s. Total?", "184.5 s.", "Add carefully."),
  W("A square garden has area 100 sq ft. Side?", "10 ft.", "\\(\\sqrt{100}\\)."),
  W("A wire 9.6 m is cut into pieces 0.4 m long. How many pieces?", "24.", "\\(9.6 / 0.4\\)."),
  W("Convert 0.125 to a fraction.", "\\(\\dfrac{1}{8}\\).", "\\(\\dfrac{125}{1000}\\) reduces."),
  W("A jar weighs 0.85 kg full and 0.32 kg empty. Contents?", "0.53 kg.", "Subtract."),
  W("Gasoline costs $3.79/gal. Cost of 8 gallons?", "$30.32.", "\\(3.79 \\cdot 8\\).")
]);

// p8: Solving Linear Equations
_addQ('prealgebra', 'p8', 0, [
  R("Solve \\(x + 11 = 4\\).", "\\(x = -7\\).", "Subtract 11."),
  R("Solve \\(x - 9 = -2\\).", "\\(x = 7\\).", "Add 9."),
  R("Solve \\(-3x = 15\\).", "\\(x = -5\\).", "Divide by \\(-3\\)."),
  R("Solve \\(\\dfrac{x}{5} = -4\\).", "\\(x = -20\\).", "Multiply by 5."),
  R("Solve \\(x + 2.5 = 7\\).", "\\(x = 4.5\\).", "Subtract 2.5."),
  R("Solve \\(7x = 0\\).", "\\(x = 0\\).", "Zero divided by anything nonzero."),
  R("Solve \\(\\dfrac{x}{-2} = 6\\).", "\\(x = -12\\).", "Multiply by \\(-2\\)."),
  R("Solve \\(x - \\dfrac{1}{2} = \\dfrac{3}{2}\\).", "\\(x = 2\\).", "Add \\(\\dfrac{1}{2}\\)."),
  R("Solve \\(-x = 8\\).", "\\(x = -8\\).", "Multiply both sides by \\(-1\\)."),
  R("Solve \\(6 = x - 4\\).", "\\(x = 10\\).", "Add 4 to both sides."),
  R("Solve \\(0 = x + 5\\).", "\\(x = -5\\).", "Subtract 5."),
  W("After spending $12 you have $35 left. Original amount \\(x\\)?", "\\(x = 47\\).", "\\(x - 12 = 35\\)."),
  W("A pizza cut into 8 equal slices; one slice weighs 90 g. Total weight?", "720 g.", "\\(w/8 = 90\\)."),
  W("Three identical books cost $42. Price each?", "$14.", "\\(3p = 42\\)."),
  W("A temperature drops 7°F to reach 22°F. Original temperature?", "29°F.", "\\(T - 7 = 22\\).")
]);
_addQ('prealgebra', 'p8', 1, [
  R("Solve \\(4x + 9 = 25\\).", "\\(x = 4\\).", "Subtract 9, divide by 4."),
  R("Solve \\(6x - 1 = 17\\).", "\\(x = 3\\).", "Add 1, divide by 6."),
  R("Solve \\(\\dfrac{x}{3} - 2 = 5\\).", "\\(x = 21\\).", "Add 2, multiply by 3."),
  R("Solve \\(8 - x = 3\\).", "\\(x = 5\\).", "Subtract 8, divide by \\(-1\\)."),
  R("Solve \\(3(x + 2) = 21\\).", "\\(x = 5\\).", "Divide by 3, subtract 2."),
  R("Solve \\(-2x + 7 = 1\\).", "\\(x = 3\\).", "Subtract 7, divide by \\(-2\\)."),
  R("Solve \\(\\dfrac{x + 5}{2} = 6\\).", "\\(x = 7\\).", "Multiply by 2, subtract 5."),
  R("Solve \\(4(x - 3) + 2 = 10\\).", "\\(x = 5\\).", "Subtract 2, divide by 4, add 3."),
  R("Solve \\(0.5x + 1 = 4\\).", "\\(x = 6\\).", "Subtract 1, multiply by 2."),
  R("Solve \\(\\dfrac{2x}{3} = 8\\).", "\\(x = 12\\).", "Multiply by 3, divide by 2."),
  R("Solve \\(2x + 3 - x = 9\\).", "\\(x = 6\\).", "Combine: \\(x + 3 = 9\\)."),
  W("A taxi costs $4 plus $1.50/mile. Total $13. Miles?", "6 miles.", "\\(4 + 1.5m = 13\\)."),
  W("A phone plan: $15 base + $0.10 per text. Bill $32. How many texts?", "170.", "\\(15 + 0.10t = 32\\)."),
  W("Renting a kayak: $20 plus $8 per hour. Total $52. Hours?", "4 hours.", "\\(20 + 8h = 52\\)."),
  W("A book club: $7 setup + $9/book. Spent $61. How many books?", "6 books.", "\\(7 + 9b = 61\\).")
]);
_addQ('prealgebra', 'p8', 2, [
  R("Solve \\(6x - 5 = 4x + 7\\).", "\\(x = 6\\).", "\\(2x = 12\\)."),
  R("Solve \\(2x + 11 = 5x - 1\\).", "\\(x = 4\\).", "Subtract \\(2x\\): \\(11 = 3x - 1\\)."),
  R("Solve \\(8 - 3x = 2x - 7\\).", "\\(x = 3\\).", "Add \\(3x\\): \\(8 = 5x - 7\\)."),
  R("Solve \\(4(x - 1) = 2(x + 3)\\).", "\\(x = 5\\).", "Distribute then collect."),
  R("Solve \\(5x + 2 = 5x + 2\\).", "All real numbers.", "Identity — true for every \\(x\\)."),
  R("Solve \\(3x + 1 = 3x + 4\\).", "No solution.", "Contradiction: \\(1 = 4\\)."),
  R("Solve \\(7x - 4 = 3x + 12\\).", "\\(x = 4\\).", "\\(4x = 16\\)."),
  R("Solve \\(2(x + 4) = x + 10\\).", "\\(x = 2\\).", "Distribute: \\(2x + 8 = x + 10\\)."),
  R("Solve \\(\\dfrac{x}{2} + 3 = x - 1\\).", "\\(x = 8\\).", "Subtract \\(\\dfrac{x}{2}\\): \\(3 = \\dfrac{x}{2} - 1\\)."),
  R("Solve \\(6 - x = 2x - 9\\).", "\\(x = 5\\).", "Add \\(x\\) then 9; divide by 3."),
  R("Solve \\(3(x - 2) = 2(x + 1)\\).", "\\(x = 8\\).", "\\(3x - 6 = 2x + 2\\)."),
  W("Plan A: $30 + $5/class. Plan B: $50 + $3/class. When equal?", "10 classes.", "\\(30 + 5n = 50 + 3n\\)."),
  W("Truck rental: $40 + $0.50/mi vs. $25 + $0.75/mi. Equal cost mileage?", "60 mi.", "\\(40 + 0.5m = 25 + 0.75m\\)."),
  W("Two siblings: older is twice the younger; sum of ages 24. Younger?", "8.", "\\(y + 2y = 24\\)."),
  W("A number doubled, decreased by 3, equals 11 more than itself. Find it.", "14.", "\\(2x - 3 = x + 11\\).")
]);
_addCumQ('prealgebra', 'p8', [
  R("Solve \\(x + 12 = 5\\).", "\\(x = -7\\).", "Subtract 12."),
  R("Solve \\(\\dfrac{x}{4} = -3\\).", "\\(x = -12\\).", "Multiply by 4."),
  R("Solve \\(-6x = 24\\).", "\\(x = -4\\).", "Divide by \\(-6\\)."),
  R("Solve \\(5x - 2 = 3\\).", "\\(x = 1\\).", "Add 2, divide by 5."),
  R("Solve \\(2(x + 3) = 14\\).", "\\(x = 4\\).", "Divide by 2, subtract 3."),
  R("Solve \\(3x + 5 = 2x + 10\\).", "\\(x = 5\\).", "Subtract \\(2x\\) and 5."),
  R("Solve \\(7x = 7x + 1\\).", "No solution.", "Contradiction."),
  R("Solve \\(\\dfrac{x - 3}{2} = 4\\).", "\\(x = 11\\).", "Multiply by 2, add 3."),
  R("Solve \\(-3(x - 1) = 6\\).", "\\(x = -1\\).", "Divide by \\(-3\\): \\(x - 1 = -2\\)."),
  R("Solve \\(8 - 2x = 0\\).", "\\(x = 4\\).", "Subtract 8, divide by \\(-2\\)."),
  R("Solve \\(5(x + 2) = 4x + 12\\).", "\\(x = 2\\).", "Distribute, collect."),
  R("Solve \\(\\dfrac{x}{3} + 1 = 4\\).", "\\(x = 9\\).", "Subtract 1, multiply by 3."),
  R("Solve \\(3x - 7 = x + 3\\).", "\\(x = 5\\).", "\\(2x = 10\\)."),
  R("Solve \\(4(x + 1) = 4x + 4\\).", "All real numbers.", "Identity."),
  R("Solve \\(0.2x = 6\\).", "\\(x = 30\\).", "Divide by 0.2."),
  W("Lily spent $9 of her allowance; she has $7 left. Allowance?", "$16.", "\\(a - 9 = 7\\)."),
  W("A printer prints 22 pages/minute; total 264 pages. Minutes?", "12.", "\\(22m = 264\\)."),
  W("A movie ticket is $11; total bill $44. Tickets bought?", "4.", "\\(11t = 44\\)."),
  W("Phone plan: $20 setup + $0.05/min. Bill $35. Minutes?", "300.", "\\(20 + 0.05m = 35\\)."),
  W("A van fits \\(x\\) crates; 3 vans hold 84 crates. Capacity?", "28 each.", "\\(3x = 84\\)."),
  W("Three consecutive integers sum to 51. Middle one?", "17.", "\\((n-1) + n + (n+1) = 51\\)."),
  W("Twice a number plus 6 equals 30. Number?", "12.", "\\(2x + 6 = 30\\)."),
  W("A garden's length is 5 ft more than width; perimeter 50 ft. Width?", "10 ft.", "\\(2w + 2(w+5) = 50\\)."),
  W("Gym A: $25/mo. Gym B: $10 + $1.50/visit. When cheaper at A?", "After 10 visits.", "\\(25 < 10 + 1.5v\\).")
]);

// p9: Math Models & Geometry
_addQ('prealgebra', 'p9', 0, [
  R("Two numbers sum to 50 and one is 4 times the other. Find them.", "10 and 40.", "\\(x + 4x = 50\\)."),
  R("Five more than three times a number is 26. Find the number.", "7.", "\\(3n + 5 = 26\\)."),
  R("Half a number decreased by 4 equals 10. Find it.", "28.", "\\(\\dfrac{n}{2} - 4 = 10\\)."),
  R("Quarters and nickels total 20 coins worth $3.40. How many quarters?", "12 quarters.", "\\(q + n = 20,\\ 25q + 5n = 340\\)."),
  R("Two consecutive even integers sum to 46. Smaller one?", "22.", "\\(n + (n+2) = 46\\)."),
  R("A 10% acid solution: how much pure acid in 250 mL?", "25 mL.", "\\(0.10 \\cdot 250\\)."),
  R("Mix 4 L of 20% saline with 6 L of 50% saline. Percent of mix?", "38%.", "\\((0.8 + 3)/10 = 0.38\\)."),
  R("Dimes and quarters total $4.10 in 20 coins. How many dimes?", "6.", "\\(10d + 25(20-d) = 410\\)."),
  R("Three consecutive odd integers sum to 75. Middle one?", "25.", "\\(3n = 75\\)."),
  R("The larger of two numbers is 3 more than twice the smaller; their sum is 36. Smaller?", "11.", "\\(s + (2s+3) = 36\\)."),
  R("A number plus its triple is 60. Find the number.", "15.", "\\(n + 3n = 60\\)."),
  W("Maria is 4 years older than her brother; the sum of their ages is 30. Maria's age?", "17.", "\\(b + (b+4) = 30\\)."),
  W("A wallet has $35 in $5 and $10 bills, 5 bills total. How many fives?", "3.", "\\(5f + 10(5-f) = 35\\)."),
  W("Mix 8 oz of 25% juice with 12 oz of 50% juice. Pure juice in mix?", "8 oz.", "\\(0.25(8) + 0.5(12) = 2 + 6\\)."),
  W("A father is 3 times as old as his son; in 12 years he'll be twice as old. Son's age now?", "12.", "\\(3s + 12 = 2(s + 12)\\).")
]);
_addQ('prealgebra', 'p9', 1, [
  R("Area of a rectangle 7×9?", "63.", "\\(lw\\)."),
  R("Perimeter of a triangle with sides 5, 6, 7?", "18.", "Sum the sides."),
  R("Area of a parallelogram base 8, height 4?", "32.", "\\(bh\\)."),
  R("Area of a trapezoid bases 6 and 10, height 5?", "40.", "\\(\\tfrac{1}{2}(6+10)(5)\\)."),
  R("Circumference of a circle diameter 14 (exact).", "\\(14\\pi\\).", "\\(\\pi d\\)."),
  R("Area of a circle radius 3 (exact).", "\\(9\\pi\\).", "\\(\\pi r^2\\)."),
  R("Perimeter of a square area 49?", "28.", "Side 7, perimeter \\(4(7)\\)."),
  R("Area of a triangle base 12, height 9?", "54.", "\\(\\tfrac{1}{2}bh\\)."),
  R("A regular hexagon has side 5. Perimeter?", "30.", "\\(6 \\cdot 5\\)."),
  R("Radius of a circle with circumference \\(20\\pi\\)?", "10.", "\\(2\\pi r = 20\\pi\\)."),
  R("Side of a square with area 121?", "11.", "\\(\\sqrt{121}\\)."),
  W("A poster is 18 in by 24 in. Area in square inches?", "432.", "\\(lw\\)."),
  W("A round pool has radius 6 ft. Area (use \\(\\pi \\approx 3.14\\))?", "\\(\\approx 113.04\\) sq ft.", "\\(\\pi r^2 \\approx 36 \\cdot 3.14\\)."),
  W("Fence a rectangular yard 25 ft × 40 ft. Fence length?", "130 ft.", "Perimeter \\(2(25+40)\\)."),
  W("A triangular sail has base 4 m and height 6 m. Sail area?", "12 sq m.", "\\(\\tfrac{1}{2}bh\\).")
]);
_addQ('prealgebra', 'p9', 2, [
  R("Volume of a rectangular prism 6×5×2?", "60.", "\\(lwh\\)."),
  R("Volume of a cube edge 7?", "343.", "\\(7^3\\)."),
  R("Surface area of a rectangular prism 2×3×4?", "52.", "\\(2(6 + 8 + 12)\\)."),
  R("Volume of a cylinder radius 3, height 8 (exact)?", "\\(72\\pi\\).", "\\(\\pi r^2 h\\)."),
  R("Volume of a cone radius 6, height 9?", "\\(108\\pi\\).", "\\(\\tfrac{1}{3}\\pi r^2 h\\)."),
  R("Volume of a sphere radius 3?", "\\(36\\pi\\).", "\\(\\tfrac{4}{3}\\pi r^3\\)."),
  R("Surface area of a sphere radius 5?", "\\(100\\pi\\).", "\\(4\\pi r^2\\)."),
  R("Volume of a triangular prism: triangle base 4, height 3, prism length 10?", "60.", "\\(\\tfrac{1}{2}(4)(3) \\cdot 10\\)."),
  R("Surface area of cube edge 5?", "150.", "\\(6 \\cdot 25\\)."),
  R("Volume of a cylinder radius 1, height 1 (exact)?", "\\(\\pi\\).", "\\(\\pi r^2 h\\)."),
  R("Edge of a cube with volume 27?", "3.", "\\(\\sqrt[3]{27}\\)."),
  W("A juice carton is 10×6×4 cm. Volume?", "240 cubic cm.", "Multiply dimensions."),
  W("A swimming pool 10 m × 5 m × 2 m. Volume?", "100 cubic m.", "Multiply."),
  W("A soup can has radius 4 cm, height 10 cm. Volume (exact)?", "\\(160\\pi\\) cubic cm.", "\\(\\pi r^2 h\\)."),
  W("Paint a cube-shaped box edge 6 ft. Surface to paint?", "216 sq ft.", "\\(6s^2\\).")
]);
_addCumQ('prealgebra', 'p9', [
  R("Area of a circle radius 4 (exact)?", "\\(16\\pi\\).", "\\(\\pi r^2\\)."),
  R("Perimeter of an equilateral triangle side 7?", "21.", "\\(3s\\)."),
  R("Volume of a cylinder radius 5, height 2 (exact)?", "\\(50\\pi\\).", "\\(\\pi r^2 h\\)."),
  R("Area of a parallelogram base 9, height 4?", "36.", "\\(bh\\)."),
  R("Two consecutive integers sum to 25. Smaller?", "12.", "\\(2n + 1 = 25\\)."),
  R("Area of a trapezoid bases 4 and 8, height 6?", "36.", "\\(\\tfrac{1}{2}(4+8)(6)\\)."),
  R("Volume of a cube with edge 10?", "1000.", "\\(10^3\\)."),
  R("Surface area of sphere radius 6?", "\\(144\\pi\\).", "\\(4\\pi r^2\\)."),
  R("Circumference of a circle radius 6 (exact)?", "\\(12\\pi\\).", "\\(2\\pi r\\)."),
  R("Three more than twice a number is 17. Number?", "7.", "\\(2n + 3 = 17\\)."),
  R("Volume of a sphere radius 6?", "\\(288\\pi\\).", "\\(\\tfrac{4}{3}\\pi (216)\\)."),
  R("Area of a triangle base 8, height 5?", "20.", "\\(\\tfrac{1}{2}bh\\)."),
  R("A 20% saline solution: pure salt in 80 mL?", "16 mL.", "\\(0.20 \\cdot 80\\)."),
  R("Dimes and quarters total 10 coins, $1.45. How many quarters?", "3.", "\\(25q + 10(10-q) = 145\\)."),
  R("Side length of a square with perimeter 48?", "12.", "\\(48/4\\)."),
  W("A garden 12 × 8 ft is fenced. Fence length?", "40 ft.", "Perimeter."),
  W("A box 4 × 5 × 6 in. Volume?", "120 cubic in.", "Multiply."),
  W("A clock face has radius 5 in. Area (exact)?", "\\(25\\pi\\) sq in.", "\\(\\pi r^2\\)."),
  W("A father is twice his son; sum of ages 36. Son?", "12.", "\\(s + 2s = 36\\)."),
  W("Mix 5 L of 20% acid with 5 L water. Percent acid in mix?", "10%.", "\\(1/10 = 10\\%\\)."),
  W("A cube tank holds 64 cubic ft of water. Edge length?", "4 ft.", "\\(\\sqrt[3]{64}\\)."),
  W("A poster is twice as long as wide; perimeter 36 in. Width?", "6 in.", "\\(2w + 2(2w) = 36\\)."),
  W("Pizza diameter 14 in. Area (use \\(\\pi \\approx 3.14\\))?", "\\(\\approx 153.86\\) sq in.", "\\(\\pi(7)^2\\)."),
  W("Two angles of a triangle are 50° and 60°. Third?", "70°.", "Angles sum to 180°.")
]);

// p10: Polynomials
_addQ('prealgebra', 'p10', 0, [
  R("Add \\((5x^2 + 2x) + (3x^2 - 7x)\\).", "\\(8x^2 - 5x\\).", "Combine like terms."),
  R("Subtract \\((6x - 1) - (2x + 4)\\).", "\\(4x - 5\\).", "Distribute the minus."),
  R("Simplify \\(4x^2 + 3x - 2 + x^2 - x\\).", "\\(5x^2 + 2x - 2\\).", "Combine like terms."),
  R("Add \\((y^3 - 2y) + (3y^3 + y - 5)\\).", "\\(4y^3 - y - 5\\).", "Combine like terms."),
  R("\\((7x - 3) + (2x + 8) - (x - 1)\\)?", "\\(8x + 6\\).", "Combine carefully with signs."),
  R("Subtract \\((4a^2 - 5a + 1) - (a^2 + 2a - 6)\\).", "\\(3a^2 - 7a + 7\\).", "Distribute and combine."),
  R("Add \\(3p + 2q\\) and \\(5p - 7q\\).", "\\(8p - 5q\\).", "Combine like terms."),
  R("Simplify \\(2x^2 - x + 3 + x^2 + 4x - 2\\).", "\\(3x^2 + 3x + 1\\).", "Combine like terms."),
  R("\\((x^2 + 3) - (x^2 - 3)\\)?", "6.", "Cancel \\(x^2\\)."),
  R("Add \\((-2m + 5) + (m - 8)\\).", "\\(-m - 3\\).", "Combine like terms."),
  R("Subtract \\((10y - 4) - (3y + 6)\\).", "\\(7y - 10\\).", "Distribute minus."),
  W("Rectangle sides \\(3x + 1\\) and \\(x - 2\\). Perimeter?", "\\(8x - 2\\).", "\\(2(3x+1) + 2(x-2)\\)."),
  W("Triangle sides \\(x + 1\\), \\(2x\\), \\(3x - 4\\). Perimeter?", "\\(6x - 3\\).", "Add sides."),
  W("Garden length \\(4x + 5\\) and you cut off \\(x + 2\\). Remaining length?", "\\(3x + 3\\).", "Subtract."),
  W("Sum of two polynomials: \\(2x + 3\\) and \\(5x - 8\\). Sum?", "\\(7x - 5\\).", "Combine.")
]);
_addQ('prealgebra', 'p10', 1, [
  R("Compute \\(5x \\cdot 4x^3\\).", "\\(20x^4\\).", "Multiply coefficients, add exponents."),
  R("Expand \\(2x(x + 3)\\).", "\\(2x^2 + 6x\\).", "Distribute."),
  R("Expand \\((x + 5)(x + 2)\\).", "\\(x^2 + 7x + 10\\).", "FOIL."),
  R("Expand \\((x - 3)(x - 4)\\).", "\\(x^2 - 7x + 12\\).", "FOIL."),
  R("Expand \\((x + 6)(x - 2)\\).", "\\(x^2 + 4x - 12\\).", "FOIL."),
  R("Expand \\((2x + 1)(x + 4)\\).", "\\(2x^2 + 9x + 4\\).", "FOIL."),
  R("Expand \\((x - 7)(x + 7)\\).", "\\(x^2 - 49\\).", "Difference of squares."),
  R("Expand \\((x + 5)^2\\).", "\\(x^2 + 10x + 25\\).", "Perfect square."),
  R("Compute \\(-3y^2 \\cdot 2y\\).", "\\(-6y^3\\).", "Multiply coefficients."),
  R("Expand \\(3(x + 2)(x - 1)\\).", "\\(3x^2 + 3x - 6\\).", "Multiply binomials first."),
  R("Expand \\((2x - 3)^2\\).", "\\(4x^2 - 12x + 9\\).", "Square first term, twice product, square last."),
  W("Rectangle sides \\(x + 4\\) and \\(x + 1\\). Area?", "\\(x^2 + 5x + 4\\).", "FOIL."),
  W("Square garden side \\(x + 3\\). Area?", "\\(x^2 + 6x + 9\\).", "\\((x+3)^2\\)."),
  W("Box of width \\(x\\), length \\(x + 2\\), height \\(3\\). Volume?", "\\(3x^2 + 6x\\).", "\\(3x(x + 2)\\)."),
  W("Triangle area = \\(\\tfrac{1}{2}bh\\) with base \\(2x\\) and height \\(x + 5\\). Area?", "\\(x^2 + 5x\\).", "Simplify.")
]);
_addQ('prealgebra', 'p10', 2, [
  R("Simplify \\(y^7 \\cdot y^2\\).", "\\(y^9\\).", "Add exponents."),
  R("Simplify \\(\\dfrac{a^{10}}{a^4}\\).", "\\(a^6\\).", "Subtract exponents."),
  R("Simplify \\((x^4)^3\\).", "\\(x^{12}\\).", "Multiply exponents."),
  R("Simplify \\((3x)^3\\).", "\\(27x^3\\).", "Cube each factor."),
  R("Compute \\(2^0\\).", "1.", "Any nonzero number to the 0 is 1."),
  R("Simplify \\(x^{-2}\\) (positive exponents).", "\\(\\dfrac{1}{x^2}\\).", "Negative exponent reciprocates."),
  R("Write \\(7.2 \\times 10^3\\) in standard form.", "7,200.", "Shift right 3."),
  R("Write \\(3.05 \\times 10^{-2}\\) in standard form.", "0.0305.", "Shift left 2."),
  R("Convert 6,800,000 to scientific notation.", "\\(6.8 \\times 10^6\\).", "Move decimal 6 places."),
  R("Convert 0.00072 to scientific notation.", "\\(7.2 \\times 10^{-4}\\).", "Move decimal 4 places right."),
  R("Simplify \\((2x^2 y)(3xy^3)\\).", "\\(6x^3 y^4\\).", "Multiply, add exponents."),
  W("Light travels about \\(3 \\times 10^8\\) m/s. Distance in 2 seconds (scientific notation)?", "\\(6 \\times 10^8\\) m.", "Multiply."),
  W("A red blood cell is about 0.000007 m wide. Write in scientific notation.", "\\(7 \\times 10^{-6}\\).", "Move decimal 6 places right."),
  W("The Earth's mass is about \\(5.97 \\times 10^{24}\\) kg. Number of zeros if written out?", "About 24 zeros (after 5.97 shift).", "Order of magnitude."),
  W("A computer does \\(2 \\times 10^9\\) operations per second. In one minute?", "\\(1.2 \\times 10^{11}\\).", "Multiply by 60.")
]);
_addCumQ('prealgebra', 'p10', [
  R("Add \\((4x + 7) + (3x - 2)\\).", "\\(7x + 5\\).", "Combine."),
  R("Subtract \\((6y - 1) - (2y + 5)\\).", "\\(4y - 6\\).", "Distribute minus."),
  R("Expand \\((x + 4)(x + 5)\\).", "\\(x^2 + 9x + 20\\).", "FOIL."),
  R("Expand \\((x - 6)(x + 6)\\).", "\\(x^2 - 36\\).", "Difference of squares."),
  R("Expand \\((x + 3)^2\\).", "\\(x^2 + 6x + 9\\).", "Perfect square."),
  R("Simplify \\(x^3 \\cdot x^5\\).", "\\(x^8\\).", "Add exponents."),
  R("Simplify \\(\\dfrac{y^9}{y^3}\\).", "\\(y^6\\).", "Subtract exponents."),
  R("Simplify \\((2y^2)^3\\).", "\\(8y^6\\).", "Cube each factor."),
  R("Compute \\(5^0\\).", "1.", "Zero exponent rule."),
  R("Compute \\(3x \\cdot 4x^2\\).", "\\(12x^3\\).", "Coefficients × variables."),
  R("Simplify \\(x^{-3}\\) (positive exponent).", "\\(\\dfrac{1}{x^3}\\).", "Negative → reciprocal."),
  R("\\((x + 2)(x^2 - x + 1)\\)?", "\\(x^3 + x^2 - x + 2\\).", "Distribute carefully."),
  R("Write 0.00045 in scientific notation.", "\\(4.5 \\times 10^{-4}\\).", "Shift 4 right."),
  R("Write 920,000 in scientific notation.", "\\(9.2 \\times 10^5\\).", "Shift 5 left."),
  R("Expand \\(2(x + 1)(x - 3)\\).", "\\(2x^2 - 4x - 6\\).", "Binomials first."),
  W("Rectangle: sides \\(x + 2\\) and \\(x + 5\\). Area?", "\\(x^2 + 7x + 10\\).", "FOIL."),
  W("Square: side \\(2x + 1\\). Area?", "\\(4x^2 + 4x + 1\\).", "Perfect square."),
  W("Triangle: base \\(4x\\), height \\(x + 3\\). Area?", "\\(2x^2 + 6x\\).", "\\(\\tfrac{1}{2}bh\\)."),
  W("Speed of sound ≈ 343 m/s. Distance in 10 seconds (scientific notation)?", "\\(3.43 \\times 10^3\\) m.", "Multiply."),
  W("A bacterium is about 0.000001 m. Scientific notation?", "\\(1 \\times 10^{-6}\\).", "Six zeros after decimal."),
  W("US population ≈ \\(3.3 \\times 10^8\\). Written out?", "330,000,000.", "Shift right 8."),
  W("The Sun's diameter is about \\(1.4 \\times 10^9\\) m. Twice that?", "\\(2.8 \\times 10^9\\) m.", "Multiply mantissa."),
  W("A box has volume \\(x(x+2)(x+3)\\). Expand.", "\\(x^3 + 5x^2 + 6x\\).", "FOIL then distribute."),
  W("Perimeter of a triangle with sides \\(2x\\), \\(3x+1\\), and \\(x+4\\)?", "\\(6x + 5\\).", "Sum the sides.")
]);

// p11: Graphs
_addQ('prealgebra', 'p11', 0, [
  R("Quadrant of \\((-7, 2)\\)?", "Quadrant II.", "Negative \\(x\\), positive \\(y\\)."),
  R("Quadrant of \\((-2, -6)\\)?", "Quadrant III.", "Both negative."),
  R("Quadrant of \\((9, 4)\\)?", "Quadrant I.", "Both positive."),
  R("Is \\((-3, 0)\\) on the x-axis or y-axis?", "x-axis.", "\\(y = 0\\)."),
  R("Coordinates of point 5 down from origin?", "\\((0, -5)\\).", "On the y-axis."),
  R("Reflect \\((4, 3)\\) over the x-axis. New point?", "\\((4, -3)\\).", "Negate \\(y\\)."),
  R("Reflect \\((4, 3)\\) over the y-axis. New point?", "\\((-4, 3)\\).", "Negate \\(x\\)."),
  R("Distance from origin to \\((0, 7)\\)?", "7.", "It's on the y-axis."),
  R("Quadrant of \\((6, -1)\\)?", "Quadrant IV.", "Positive \\(x\\), negative \\(y\\)."),
  R("Midpoint of \\((0, 0)\\) and \\((6, 8)\\)?", "\\((3, 4)\\).", "Average coordinates."),
  R("Which axis passes through \\((0, -5)\\)?", "y-axis.", "\\(x = 0\\)."),
  W("From origin, walk 2 left and 3 up. Coordinates?", "\\((-2, 3)\\).", "Left = \\(-x\\), up = \\(+y\\)."),
  W("Map: school at origin, park at (4, 0), library at (0, 3). Which is farther?", "Park, 4 units.", "Compare distances."),
  W("A treasure is 5 right and 7 down. Coordinates?", "\\((5, -7)\\).", "Right = \\(+x\\), down = \\(-y\\)."),
  W("A bus stop is at \\((-3, 0)\\). On which axis?", "x-axis (negative side).", "\\(y = 0\\).")
]);
_addQ('prealgebra', 'p11', 1, [
  R("Is \\((1, 4)\\) on \\(y = 3x + 1\\)?", "Yes.", "\\(3(1) + 1 = 4\\)."),
  R("Is \\((2, 5)\\) on \\(y = 2x + 3\\)?", "No (gives 7).", "\\(2(2) + 3 = 7\\)."),
  R("y-intercept of \\(y = -4x + 9\\)?", "9.", "Set \\(x = 0\\)."),
  R("x-intercept of \\(3x - y = 6\\)?", "\\(x = 2\\).", "Set \\(y = 0\\): \\(3x = 6\\)."),
  R("y-intercept of \\(2x + 5y = 10\\)?", "2.", "Set \\(x = 0\\): \\(5y = 10\\)."),
  R("Find three solutions to \\(y = 2x\\).", "\\((0,0), (1,2), (2,4)\\).", "Pick \\(x\\), compute \\(y\\)."),
  R("Find a solution to \\(y = -x + 6\\) with \\(x = 4\\).", "\\((4, 2)\\).", "\\(y = -4 + 6\\)."),
  R("Graph type: \\(y = 5\\)?", "Horizontal line.", "Constant \\(y\\)."),
  R("Graph type: \\(x = -3\\)?", "Vertical line.", "Constant \\(x\\)."),
  R("Does \\((0, 7)\\) lie on \\(y = 7\\)?", "Yes.", "Every \\(x\\) gives \\(y = 7\\)."),
  R("y-intercept of \\(y = \\dfrac{1}{2}x - 4\\)?", "\\(-4\\).", "Constant term."),
  W("\\(y = 3x + 2\\) models cookies after \\(x\\) batches. How many cookies after 5 batches?", "17.", "\\(3(5) + 2\\)."),
  W("\\(y = 100 - 5x\\) models miles left after \\(x\\) hours. Miles after 8 hours?", "60.", "\\(100 - 40\\)."),
  W("Line passes through \\((0, 4)\\) and \\((2, 8)\\). y-intercept?", "4.", "At \\(x = 0\\)."),
  W("\\(y = 8x\\) is your earnings at $8/hour. Earnings for 6 hrs?", "$48.", "\\(8 \\cdot 6\\).")
]);
_addQ('prealgebra', 'p11', 2, [
  R("Slope through \\((0, 0)\\) and \\((4, 8)\\)?", "2.", "\\(8/4\\)."),
  R("Slope through \\((1, 5)\\) and \\((5, 1)\\)?", "\\(-1\\).", "\\((1-5)/(5-1)\\)."),
  R("Slope through \\((-2, 3)\\) and \\((4, 3)\\)?", "0.", "Horizontal."),
  R("Slope through \\((2, -1)\\) and \\((2, 7)\\)?", "Undefined.", "Vertical."),
  R("Slope through \\((-1, -2)\\) and \\((3, 6)\\)?", "2.", "\\(8/4\\)."),
  R("Slope of \\(y = -7x + 1\\)?", "\\(-7\\).", "Coefficient of \\(x\\)."),
  R("Slope of \\(y = \\dfrac{2}{3}x + 5\\)?", "\\(\\dfrac{2}{3}\\).", "Coefficient of \\(x\\)."),
  R("Two lines with the same slope are…", "parallel.", "Same slope ⇒ parallel."),
  R("Slope of a line perpendicular to slope 4?", "\\(-\\dfrac{1}{4}\\).", "Negative reciprocal."),
  R("Slope through \\((0, 6)\\) and \\((3, 0)\\)?", "\\(-2\\).", "\\(-6/3\\)."),
  R("Slope through \\((-4, 2)\\) and \\((0, 0)\\)?", "\\(-\\dfrac{1}{2}\\).", "\\(-2/4\\)."),
  W("A roof rises 4 ft for every 12 ft of run. Slope?", "\\(\\dfrac{1}{3}\\).", "\\(4/12\\)."),
  W("A car travels 60 mi in 2 hr. Slope on distance-time graph?", "30.", "\\(60/2\\)."),
  W("A pool drains 50 gal in 5 min. Slope?", "\\(-10\\).", "Loses 10 gal/min."),
  W("A trail descends 200 ft over 1000 ft horizontal. Slope?", "\\(-\\dfrac{1}{5}\\).", "\\(-200/1000\\).")
]);
_addCumQ('prealgebra', 'p11', [
  R("Quadrant of \\((4, -7)\\)?", "Quadrant IV.", "Positive \\(x\\), negative \\(y\\)."),
  R("Quadrant of \\((-1, 6)\\)?", "Quadrant II.", "Negative \\(x\\), positive \\(y\\)."),
  R("Is \\((0, 0)\\) on the x-axis?", "Yes (it's the origin, on both).", "Origin lies on both axes."),
  R("Slope through \\((3, 1)\\) and \\((5, 9)\\)?", "4.", "\\(8/2\\)."),
  R("Slope through \\((-2, 4)\\) and \\((2, 4)\\)?", "0.", "Horizontal."),
  R("Slope through \\((5, 1)\\) and \\((5, 8)\\)?", "Undefined.", "Vertical line."),
  R("y-intercept of \\(y = 4x - 9\\)?", "\\(-9\\).", "Constant term."),
  R("x-intercept of \\(y = 2x - 6\\)?", "\\(x = 3\\).", "Set \\(y = 0\\)."),
  R("Is \\((3, 6)\\) on \\(y = 2x\\)?", "Yes.", "\\(2(3) = 6\\)."),
  R("Slope of horizontal line?", "0.", "No rise."),
  R("Slope of vertical line?", "Undefined.", "No run."),
  R("Slope of \\(y = 3x + 2\\)?", "3.", "Coefficient of \\(x\\)."),
  R("Reflect \\((5, -2)\\) over the y-axis.", "\\((-5, -2)\\).", "Negate \\(x\\)."),
  R("Midpoint of \\((2, 4)\\) and \\((8, 10)\\)?", "\\((5, 7)\\).", "Average."),
  R("Slope of a line perpendicular to slope \\(\\dfrac{1}{2}\\)?", "\\(-2\\).", "Negative reciprocal."),
  W("A hill rises 15 ft over 60 ft. Slope?", "\\(\\dfrac{1}{4}\\).", "\\(15/60\\)."),
  W("Earnings \\(E = 12h\\). \\(E\\) at \\(h = 5\\)?", "$60.", "\\(12 \\cdot 5\\)."),
  W("Phone bill \\(C = 20 + 0.05t\\). \\(C\\) at \\(t = 100\\)?", "$25.", "\\(20 + 5\\)."),
  W("A balloon descends 4 ft/s from 100 ft. Equation \\(h(t)\\)?", "\\(h = 100 - 4t\\).", "Start minus rate × time."),
  W("Distance-time line: 0 to 240 mi in 4 hr. Slope?", "60.", "mi/hr."),
  W("Plot \\((0, 3)\\) and \\((4, 0)\\). Slope?", "\\(-\\dfrac{3}{4}\\).", "\\((0-3)/(4-0)\\)."),
  W("Mark Aaron 6 blocks east and 8 blocks north of school. Distance from school?", "10 blocks.", "Pythagorean: \\(\\sqrt{36+64}\\)."),
  W("A ladder rises 9 ft over 3 ft horizontal. Slope?", "3.", "\\(9/3\\)."),
  W("A car's gas drops from 12 gal to 4 gal over 200 mi. Slope of gas-vs-mi line?", "\\(-\\dfrac{1}{25}\\).", "\\(-8/200\\).")
]);
