# Chart Reader demo

Demos for an in-class presentation of *Chart Reader: Accessible Visualization Experiences Designed with Screen Reader Users* (Thompson, Martinez, Sarikaya, Cutrell, Lee, CHI 2023).

- `screen-reader.html`: what the NYT yield-curve graphic exposes to a screen reader (reading order taken from Chrome's accessibility tree).
- `chart-reader.html`: the same data in the Chart Reader engine ([microsoft/chart-reader](https://github.com/microsoft/chart-reader), MIT license, see `assets/js/chartreader.LICENSE.txt`). Built from source with small changes: series colors (fixed per series), local earcon files, a non-overlapping insights legend, and the y-axis description reading the y-axis label.
- `visual.html`: the NYT graphic rebuilt from its original code; data and images load from the NYT asset server.
- `pivot.html`: P turns between one maturity over time and one date across maturities, staying on the same point. D describes the current line (pattern, relation, outliers) in words generated from the data; moving along the line calls out hills, valleys and sudden moves.
- `play.html` / `host.html`: live quiz. Answers go to a Google Sheet through an Apps Script web app (`assets/js/config.js`).

Data: U.S. Treasury constant-maturity yields, Federal Reserve H.15 via FRED, monthly averages Jan 1990 to Mar 2015 (daily values for March 18, 2015).
Original graphic: Gregor Aisch and Amanda Cox, “A 3-D View of a Chart That Predicts the Economic Future: The Yield Curve,” The New York Times, March 2015.
