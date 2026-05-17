// Statistics course — descriptive stats, probability, distributions, inference, regression.
const STATISTICS_COURSE = {
  id: "statistics",
  title: "Statistics",
  subtitle: "Data, probability, inference, regression",
  emoji: "📊",
  accent: "#1dd1a1",
  accent2: "#54a0ff",
  description: "Six chapters from data basics and probability through inference and linear regression.",
  books: [
    {
      id: "st1", num: 1, title: "Data Basics", subtitle: "Types of data and frequency",
      emoji: "📊", accent: "#1dd1a1", accent2: "#54a0ff",
      sections: [
        {
          title: "Types of Data",
          questions: [
            { type: "regular", q: "Is shoe size categorical or numerical?", answer: "Numerical (discrete).", solution: "Numbers with meaning." },
            { type: "regular", q: "Is eye color categorical or numerical?", answer: "Categorical.", solution: "Names, not measurements." },
            { type: "regular", q: "Continuous or discrete: temperature?", answer: "Continuous.", solution: "Any value in a range." },
            { type: "regular", q: "Continuous or discrete: number of pets?", answer: "Discrete.", solution: "Whole-number counts." },
            { type: "word", q: "Survey \"favorite sport\" data type?", answer: "Categorical.", solution: "Names of sports." }
          ]
        },
        {
          title: "Frequency Distributions",
          questions: [
            { type: "regular", q: "5, 5, 6, 7, 7, 7, 8. Mode?", answer: "7.", solution: "Appears 3 times." },
            { type: "regular", q: "Frequency of 5 in [5, 5, 6, 7]?", answer: "2.", solution: "Count occurrences." },
            { type: "regular", q: "Relative frequency of 5 in [5, 5, 6, 7]?", answer: "0.5 or 50%.", solution: "2/4." },
            { type: "regular", q: "Range of [3, 8, 5, 11, 2]?", answer: "9.", solution: "Max − min." },
            { type: "word", q: "Class of 20 students; 5 say red is their favorite color. Relative frequency?", answer: "0.25 or 25%.", solution: "5/20." }
          ]
        },
        {
          title: "Graphs: Bar, Histogram, Box Plot",
          questions: [
            { type: "regular", q: "Best graph for categorical data?", answer: "Bar chart.", solution: "Categories on x-axis." },
            { type: "regular", q: "Best graph for numerical distribution?", answer: "Histogram.", solution: "Continuous bins." },
            { type: "regular", q: "Box plot shows what 5 values?", answer: "Min, Q1, median, Q3, max.", solution: "Five-number summary." },
            { type: "regular", q: "A right-skewed distribution has tail on which side?", answer: "Right.", solution: "Long tail to right." },
            { type: "word", q: "Pie chart works best for?", answer: "Showing parts of a whole.", solution: "Categorical proportions." }
          ]
        }
      ],
      cumulativeTest: {
        title: "Cumulative Test — Data Basics",
        questions: [
          { type: "regular", q: "Numerical or categorical: hair color?", answer: "Categorical.", solution: "Names." },
          { type: "regular", q: "Continuous or discrete: heart rate?", answer: "Continuous.", solution: "Any value." },
          { type: "regular", q: "Range of [4, 9, 12, 3, 7]?", answer: "9.", solution: "12 − 3." },
          { type: "regular", q: "Best plot for showing distribution of test scores?", answer: "Histogram.", solution: "Numerical, binned." },
          { type: "word", q: "Mode of [2, 3, 3, 5, 7]?", answer: "3.", solution: "Most common." },
          { type: "word", q: "Box plot shows which values?", answer: "Min, Q1, median, Q3, max.", solution: "Five-number summary." }
        ]
      }
    },
    {
      id: "st2", num: 2, title: "Measures of Center & Spread", subtitle: "Mean, median, std deviation",
      emoji: "📐", accent: "#54a0ff", accent2: "#48dbfb",
      sections: [
        {
          title: "Mean, Median, Mode",
          questions: [
            { type: "regular", q: "Mean of [4, 6, 8, 10]?", answer: "7.", solution: "Sum/count = 28/4." },
            { type: "regular", q: "Median of [3, 5, 7, 9, 11]?", answer: "7.", solution: "Middle value." },
            { type: "regular", q: "Median of [2, 4, 6, 8]?", answer: "5.", solution: "Average of two middle." },
            { type: "regular", q: "Mode of [1, 2, 2, 3, 4]?", answer: "2.", solution: "Most frequent." },
            { type: "word", q: "Best center for skewed data?", answer: "Median.", solution: "Resists outliers." }
          ]
        },
        {
          title: "Variance & Standard Deviation",
          questions: [
            { type: "regular", q: "Variance of [2, 4, 4, 6] (population)?", answer: "2.", solution: "Mean 4; squared deviations: 4+0+0+4=8; ÷4=2." },
            { type: "regular", q: "Std dev formula relationship to variance?", answer: "\\(\\sigma = \\sqrt{\\text{var}}\\).", solution: "Square root." },
            { type: "regular", q: "What does std dev measure?", answer: "Spread around the mean.", solution: "Typical distance from mean." },
            { type: "regular", q: "If all data points equal, std dev?", answer: "0.", solution: "No spread." },
            { type: "word", q: "Compare datasets: A has std 2, B has std 10. Which is more spread?", answer: "B.", solution: "Larger std = more spread." }
          ]
        },
        {
          title: "Quartiles, IQR, Z-Scores",
          questions: [
            { type: "regular", q: "IQR = ?", answer: "\\(Q_3 - Q_1\\).", solution: "Interquartile range." },
            { type: "regular", q: "Z-score formula?", answer: "\\(z = \\dfrac{x - \\mu}{\\sigma}\\).", solution: "Standardized value." },
            { type: "regular", q: "Z-score of 75 with mean 70, std 5?", answer: "1.", solution: "\\((75-70)/5\\)." },
            { type: "regular", q: "Outlier rule (1.5 IQR)?", answer: "Below \\(Q_1 - 1.5(IQR)\\) or above \\(Q_3 + 1.5(IQR)\\).", solution: "Standard outlier definition." },
            { type: "word", q: "Test score 85; mean 75, std 5. Z-score?", answer: "2.", solution: "\\((85-75)/5\\)." }
          ]
        }
      ],
      cumulativeTest: {
        title: "Cumulative Test — Center & Spread",
        questions: [
          { type: "regular", q: "Mean of [5, 10, 15]?", answer: "10.", solution: "Sum/count." },
          { type: "regular", q: "Median of [2, 5, 8, 10]?", answer: "6.5.", solution: "(5+8)/2." },
          { type: "regular", q: "Std dev: spread or center?", answer: "Spread.", solution: "Around mean." },
          { type: "regular", q: "Z-score of 95 with mean 80, std 10?", answer: "1.5.", solution: "(95-80)/10." },
          { type: "word", q: "If std dev is 0, all values are?", answer: "Equal.", solution: "No spread." },
          { type: "word", q: "IQR = ?", answer: "\\(Q_3 - Q_1\\).", solution: "Standard." }
        ]
      }
    },
    {
      id: "st3", num: 3, title: "Probability", subtitle: "Sample spaces, independence, conditional",
      emoji: "🎲", accent: "#5f27cd", accent2: "#48dbfb",
      sections: [
        {
          title: "Basic Probability",
          questions: [
            { type: "regular", q: "P(heads) on a fair coin?", answer: "1/2.", solution: "Equal outcomes." },
            { type: "regular", q: "P(rolling 6 on a die)?", answer: "1/6.", solution: "One of six." },
            { type: "regular", q: "Sample space of two coin flips?", answer: "{HH, HT, TH, TT}.", solution: "4 outcomes." },
            { type: "regular", q: "P(not 6) on a die?", answer: "5/6.", solution: "Complement." },
            { type: "word", q: "Drawing king from a deck?", answer: "4/52 = 1/13.", solution: "4 kings." }
          ]
        },
        {
          title: "Independent vs. Conditional",
          questions: [
            { type: "regular", q: "Two coins: P(both heads)?", answer: "1/4.", solution: "Multiply 1/2 · 1/2." },
            { type: "regular", q: "P(A and B) for independent events?", answer: "P(A) · P(B).", solution: "Standard." },
            { type: "regular", q: "P(B | A) formula?", answer: "P(A∩B)/P(A).", solution: "Conditional." },
            { type: "regular", q: "P(A or B) for mutually exclusive?", answer: "P(A) + P(B).", solution: "No overlap." },
            { type: "word", q: "Bag: 5 red, 3 blue. P(both red drawing 2 without replacement)?", answer: "5/14.", solution: "5/8 · 4/7." }
          ]
        },
        {
          title: "Bayes' Theorem (intro)",
          questions: [
            { type: "regular", q: "Bayes' formula?", answer: "P(A|B) = P(B|A)P(A)/P(B).", solution: "Standard." },
            { type: "regular", q: "If P(A|B) = 0.4 and P(B) = 0.5, then P(A and B)?", answer: "0.2.", solution: "P(A|B)P(B)." },
            { type: "regular", q: "Total probability: if A1, A2 partition, P(B) = ?", answer: "P(B|A1)P(A1) + P(B|A2)P(A2).", solution: "Law of total probability." },
            { type: "regular", q: "Disease test: 95% sensitivity. P(positive | disease)?", answer: "0.95.", solution: "Sensitivity definition." },
            { type: "word", q: "P(disease | positive) requires more info than sensitivity. True/False?", answer: "True.", solution: "Need prevalence and false positive rate." }
          ]
        }
      ],
      cumulativeTest: {
        title: "Cumulative Test — Probability",
        questions: [
          { type: "regular", q: "P(tails) on a fair coin?", answer: "1/2.", solution: "Basic." },
          { type: "regular", q: "P(both tails on two flips)?", answer: "1/4.", solution: "Independent." },
          { type: "regular", q: "P(A and B) if independent?", answer: "P(A)P(B).", solution: "Multiply." },
          { type: "regular", q: "P(7 on two dice)?", answer: "1/6.", solution: "6 ways of 36." },
          { type: "word", q: "P(king from a deck)?", answer: "1/13.", solution: "4/52." },
          { type: "word", q: "Conditional P(B|A) formula?", answer: "P(A∩B)/P(A).", solution: "Standard." }
        ]
      }
    },
    {
      id: "st4", num: 4, title: "Distributions", subtitle: "Binomial and normal",
      emoji: "📈", accent: "#ff6b9d", accent2: "#feca57",
      sections: [
        {
          title: "Binomial Distribution",
          questions: [
            { type: "regular", q: "Binomial requires?", answer: "Fixed n trials, two outcomes, independent, constant p.", solution: "Four conditions." },
            { type: "regular", q: "Mean of binomial?", answer: "np.", solution: "Standard formula." },
            { type: "regular", q: "Variance of binomial?", answer: "np(1−p).", solution: "Standard." },
            { type: "regular", q: "P(X=k) for binomial?", answer: "\\(\\binom{n}{k}p^k(1-p)^{n-k}\\).", solution: "Standard PMF." },
            { type: "word", q: "10 coin flips. Expected number of heads?", answer: "5.", solution: "np = 10·0.5." }
          ]
        },
        {
          title: "Normal Distribution",
          questions: [
            { type: "regular", q: "Symmetric bell-shaped distribution?", answer: "Normal.", solution: "Standard." },
            { type: "regular", q: "What % within 1 std of mean (normal)?", answer: "~68%.", solution: "Empirical rule." },
            { type: "regular", q: "Within 2 std?", answer: "~95%.", solution: "Empirical rule." },
            { type: "regular", q: "Standard normal: mean and std?", answer: "Mean 0, std 1.", solution: "Standard." },
            { type: "word", q: "Test scores normal, mean 100, std 15. % between 85 and 115?", answer: "~68%.", solution: "Within 1 std." }
          ]
        },
        {
          title: "Central Limit Theorem",
          questions: [
            { type: "regular", q: "CLT: sample means approach what distribution?", answer: "Normal.", solution: "For large n." },
            { type: "regular", q: "Sample mean std error?", answer: "\\(\\sigma/\\sqrt{n}\\).", solution: "Standard error." },
            { type: "regular", q: "CLT works for large n regardless of population distribution. True/False?", answer: "True.", solution: "Key insight." },
            { type: "regular", q: "If \\(\\sigma = 10, n = 25\\), standard error?", answer: "2.", solution: "\\(10/5\\)." },
            { type: "word", q: "Population std 20; sample of 100. Sample mean's std?", answer: "2.", solution: "\\(20/\\sqrt{100}\\)." }
          ]
        }
      ],
      cumulativeTest: {
        title: "Cumulative Test — Distributions",
        questions: [
          { type: "regular", q: "Mean of binomial(n, p)?", answer: "np.", solution: "Standard." },
          { type: "regular", q: "Normal: % within 2 std?", answer: "~95%.", solution: "Empirical." },
          { type: "regular", q: "Standard normal mean?", answer: "0.", solution: "Definition." },
          { type: "regular", q: "Standard error formula?", answer: "\\(\\sigma/\\sqrt{n}\\).", solution: "Standard." },
          { type: "word", q: "20 coin flips. Expected heads?", answer: "10.", solution: "np." },
          { type: "word", q: "Normal mean 50, std 5. P(X > 60)?", answer: "~2.5%.", solution: "2 std above mean; tail." }
        ]
      }
    },
    {
      id: "st5", num: 5, title: "Inference", subtitle: "Confidence intervals and hypothesis tests",
      emoji: "✅", accent: "#feca57", accent2: "#ff9f43",
      sections: [
        {
          title: "Confidence Intervals",
          questions: [
            { type: "regular", q: "95% CI for mean uses what z?", answer: "1.96.", solution: "Standard critical value." },
            { type: "regular", q: "CI formula for mean?", answer: "\\(\\bar{x} \\pm z\\cdot \\sigma/\\sqrt{n}\\).", solution: "Standard." },
            { type: "regular", q: "Larger sample → CI width?", answer: "Narrower.", solution: "Std error decreases." },
            { type: "regular", q: "Higher confidence → CI width?", answer: "Wider.", solution: "Larger z." },
            { type: "word", q: "Mean 50, std 10, n=100, 95% CI?", answer: "\\(50 \\pm 1.96\\).", solution: "\\(z\\sigma/\\sqrt n = 1.96\\)." }
          ]
        },
        {
          title: "Hypothesis Testing",
          questions: [
            { type: "regular", q: "Null hypothesis H0 is?", answer: "Statement of no effect / no difference.", solution: "Standard." },
            { type: "regular", q: "p-value < α means?", answer: "Reject H0.", solution: "Significant evidence." },
            { type: "regular", q: "α = significance level. Typical value?", answer: "0.05.", solution: "Standard." },
            { type: "regular", q: "Type I error?", answer: "Reject H0 when it's true.", solution: "False positive." },
            { type: "word", q: "p = 0.03, α = 0.05. Conclusion?", answer: "Reject H0.", solution: "p < α." }
          ]
        },
        {
          title: "p-values & Errors",
          questions: [
            { type: "regular", q: "Type II error?", answer: "Fail to reject H0 when it's false.", solution: "False negative." },
            { type: "regular", q: "Power = ?", answer: "1 − P(Type II).", solution: "Probability of detecting true effect." },
            { type: "regular", q: "p-value definition?", answer: "Probability of seeing data this extreme if H0 true.", solution: "Standard." },
            { type: "regular", q: "Smaller p means?", answer: "Stronger evidence against H0.", solution: "Less likely under H0." },
            { type: "word", q: "p = 0.40. Reject H0 at α=0.05?", answer: "No.", solution: "p > α." }
          ]
        }
      ],
      cumulativeTest: {
        title: "Cumulative Test — Inference",
        questions: [
          { type: "regular", q: "95% CI z-value?", answer: "1.96.", solution: "Standard." },
          { type: "regular", q: "Type I error?", answer: "Reject true H0.", solution: "False positive." },
          { type: "regular", q: "p = 0.02, α = 0.05?", answer: "Reject H0.", solution: "p < α." },
          { type: "regular", q: "Larger n → CI?", answer: "Narrower.", solution: "Std error down." },
          { type: "word", q: "Power = ?", answer: "1 − P(Type II).", solution: "Standard." },
          { type: "word", q: "p-value plain English?", answer: "Chance of data this extreme assuming H0 true.", solution: "Standard." }
        ]
      }
    },
    {
      id: "st6", num: 6, title: "Regression & Correlation", subtitle: "Linear relationships in data",
      emoji: "📉", accent: "#ee5a6f", accent2: "#f1c40f",
      sections: [
        {
          title: "Correlation",
          questions: [
            { type: "regular", q: "Correlation r range?", answer: "−1 to 1.", solution: "Standard." },
            { type: "regular", q: "r = 0 means?", answer: "No linear relationship.", solution: "Could still be nonlinear." },
            { type: "regular", q: "r = 1 means?", answer: "Perfect positive linear.", solution: "All points on a line." },
            { type: "regular", q: "Strong negative correlation r value?", answer: "Close to −1.", solution: "Standard." },
            { type: "word", q: "Correlation does NOT imply causation. True/False?", answer: "True.", solution: "Key principle." }
          ]
        },
        {
          title: "Linear Regression",
          questions: [
            { type: "regular", q: "Regression line: \\(y = ?\\)", answer: "\\(\\hat y = a + bx\\) or \\(mx+b\\).", solution: "Standard form." },
            { type: "regular", q: "Slope = ?", answer: "\\(r \\cdot s_y/s_x\\).", solution: "Standard." },
            { type: "regular", q: "Best-fit line minimizes?", answer: "Sum of squared residuals.", solution: "Least squares." },
            { type: "regular", q: "If r = 0.8, sign of slope?", answer: "Positive.", solution: "r and b have same sign." },
            { type: "word", q: "Prediction for x = 5 on line \\(y = 2 + 3x\\)?", answer: "17.", solution: "Plug in." }
          ]
        },
        {
          title: "Residuals & Goodness of Fit",
          questions: [
            { type: "regular", q: "Residual = ?", answer: "Observed − Predicted.", solution: "Standard." },
            { type: "regular", q: "R² interpretation?", answer: "Proportion of variation explained by model.", solution: "Standard." },
            { type: "regular", q: "Residual plot should look?", answer: "Random scatter around 0.", solution: "No pattern." },
            { type: "regular", q: "If R² = 0.9, model explains?", answer: "90% of variation.", solution: "Standard." },
            { type: "word", q: "Negative residual means?", answer: "Model overestimated.", solution: "Predicted > observed." }
          ]
        }
      ],
      cumulativeTest: {
        title: "Cumulative Test — Regression",
        questions: [
          { type: "regular", q: "Range of r?", answer: "−1 to 1.", solution: "Standard." },
          { type: "regular", q: "Best-fit line minimizes?", answer: "Sum of squared residuals.", solution: "Standard." },
          { type: "regular", q: "Residual = ?", answer: "Observed − Predicted.", solution: "Standard." },
          { type: "regular", q: "R² = 0.64 means r could be?", answer: "±0.8.", solution: "Square root." },
          { type: "word", q: "Strong positive correlation r?", answer: "Close to 1.", solution: "Standard." },
          { type: "word", q: "On line \\(y = 1 + 2x\\), predict y at x = 4.", answer: "9.", solution: "Plug in." }
        ]
      }
    }
  ]
};
