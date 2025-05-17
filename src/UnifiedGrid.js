import React, { useState, useEffect } from "react";

const UnifiedGrid = () => {
  const squareSize = 50;
  const spacing = 5;
  const gridUnit = squareSize + spacing;

  const [text, setText] = useState("");
  const [timeLevel, setTimeLevel] = useState(7);
  const [outsideLevel, setOutsideLevel] = useState(2);
  const [feelingLevel, setFeelingLevel] = useState(4);
  const [insideLevel, setInsideLevel] = useState(1);

  const [gridWidth, setGridWidth] = useState(0);
  const [gridHeight, setGridHeight] = useState(0);
  const [distortedPatternMap, setDistortedPatternMap] = useState([]);
  const [visibleWords, setVisibleWord] = useState("");
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const [time, setTime] = useState(Date.now());
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    const updateGridSize = () => {
      setGridWidth(Math.floor(window.innerWidth / gridUnit));
      setGridHeight(Math.floor(window.innerHeight / gridUnit));
    };
    updateGridSize();
    window.addEventListener("resize", updateGridSize);
    return () => window.removeEventListener("resize", updateGridSize);
  }, []);

  useEffect(() => {
    if (!text) return;
    const words = text.split(" ");
    let index = 0;
    setVisibleWord(words[0]);
    const minDelay = 400;
    const maxDelay = 2000;
    const clampedLevel = Math.max(1, Math.min(8, timeLevel));
    const delay = maxDelay - ((clampedLevel - 1) / 7) * (maxDelay - minDelay);
    const interval = setInterval(() => {
      index = (index + 1) % words.length;
      setVisibleWord(words[index]);
    }, delay);
    return () => clearInterval(interval);
  }, [text, timeLevel]);

  useEffect(() => {
    const handleMouseMove = (e) => setMouse({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setTime(Date.now()), 1000 / 60);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const distorted = [];
    const normalizedFeeling = (feelingLevel - 1) / 7;
    let distortion = normalizedFeeling < 0.5 ? 0 : Math.min((normalizedFeeling - 0.5) * 2, 0.8);
    let fillExtra = normalizedFeeling < 0.5;
    const lines = [];
    for (let i = 0; i < visibleWords.length; i += 10) {
      lines.push(visibleWords.slice(i, i + 10));
    }
    lines.forEach((line, lineIdx) => {
      [...line].forEach((char, charIdx) => {
        const pattern = getCharacterPattern(char);
        if (!pattern) return;
        const distortedPattern = pattern.map(row =>
          row.map(cell => {
            if (fillExtra && !cell) return Math.random() < (0.5 - normalizedFeeling) ? 1 : 0;
            return cell && Math.random() < distortion ? 0 : cell;
          })
        );
        distorted.push({ char, charIdx, lineIdx, pattern: distortedPattern });
      });
    });
    setDistortedPatternMap(distorted);
  }, [visibleWords, feelingLevel]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key.length === 1) setText((prev) => prev + e.key);
      else if (e.key === "Backspace") setText((prev) => prev.slice(0, -1));
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const renderSquares = () => {
    const squares = [];
    const cols = Math.floor(window.innerWidth / gridUnit);
    const rows = Math.floor(window.innerHeight / gridUnit);
    const charsPerLine = 10;
    const charSpacingX = 6;
    const charSpacingY = 9;
    const lines = [];
    for (let i = 0; i < visibleWords.length; i += charsPerLine) {
      lines.push(visibleWords.slice(i, i + charsPerLine));
    }
    const maxLineLength = Math.max(...lines.map((line) => line.length));
    const totalTextWidth = maxLineLength * charSpacingX;
    const totalTextHeight = lines.length * charSpacingY;
    const offsetX = Math.floor(cols / 2) - Math.floor(totalTextWidth / 2);
    const offsetY = Math.floor(rows / 2) - Math.floor(totalTextHeight / 2);
    const textMap = new Set();
    distortedPatternMap.forEach(({ charIdx, lineIdx, pattern }) => {
      for (let i = 0; i < pattern.length; i++) {
        for (let j = 0; j < pattern[i].length; j++) {
          if (pattern[i][j]) {
            const gridX = offsetX + j + (charIdx * charSpacingX);
            const gridY = offsetY + i + (lineIdx * charSpacingY);
            textMap.add(`${gridX}-${gridY}`);
          }
        }
      }
    });
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        let dynamicSquareSize = squareSize * (1 + (insideLevel / 8) * 1.5);
        const baseX = col * gridUnit;
        const baseY = row * gridUnit;
        const offset = (dynamicSquareSize - squareSize) / 2;
        const x = baseX - offset;
        const y = baseY - offset;
        const isChar = textMap.has(`${col}-${row}`);
        let rotateX = 90, rotateY = 0;
        if (!isChar) {
          const chaos = Math.max(0.1, outsideLevel / 8);
          const baseRotateX = Math.sin((row + time / (200 * (1 - chaos + 0.1))) / 5) * 45 * chaos;
          const baseRotateY = Math.cos((col + time / (200 * (1 - chaos + 0.1))) / 5) * 45 * chaos;
          const mouseAngle = Math.atan2(mouse.y - y, mouse.x - x);
          const mouseSpeed = 100;
          rotateX = baseRotateX + Math.sin(mouseAngle) * mouseSpeed;
          rotateY = baseRotateY + Math.cos(mouseAngle) * mouseSpeed;
        }
        squares.push(
          <div
            key={`sq-${row}-${col}`}
            style={{
              position: "absolute",
              top: y,
              left: x,
              width: dynamicSquareSize,
              height: dynamicSquareSize,
              backgroundColor: "white",
              transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
              transition: "transform 0.05s ease-out",
            }}
          />
        );
      }
    }
    return squares;
  };

  const renderSliders = () => {
    const sliders = [
      { label: "RECEPTION", value: timeLevel, setter: setTimeLevel },
      { label: "OUTSIDE", value: outsideLevel, setter: setOutsideLevel },
      { label: "INSIDE", value: insideLevel, setter: setInsideLevel },
      { label: "FEELING", value: feelingLevel, setter: setFeelingLevel },
    ];
    return (
      <div style={{ position: "absolute", bottom: 0, width: "100%", display: "flex", justifyContent: "space-around", padding: 10, background: "black" }}>
        {sliders.map(({ label, value, setter }) => (
          <div key={label} style={{ textAlign: "center", fontFamily: "monospace" }}>
            <div>{label}</div>
            <div style={{ display: "flex" }}>
              {Array.from({ length: 8 }, (_, i) => (
                <div
                  key={i}
                  onClick={() => setter(i + 1)}
                  style={{
                    width: 20,
                    height: 20,
                    margin: 2,
                    border: "1px solid white",
                    backgroundColor: i < value ? "white" : "transparent",
                    cursor: "pointer",
                  }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const getCharacterPattern = (char) => {
    const characterMap = {
        A: [
            [0, 0, 1, 0, 0],
            [0, 1, 0, 1, 0],
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 1],
            [1, 1, 1, 1, 1],
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 1],
          ],
          B: [
            [1, 1, 1, 1, 0],
            [0, 1, 0, 0, 1],
            [0, 1, 0, 0, 1],
            [0, 1, 1, 1, 0],
            [0, 1, 0, 0, 1],
            [0, 1, 0, 0, 1],
            [1, 1, 1, 1, 0],
          ],
          C: [
            [0, 1, 1, 1, 0],
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 0],
            [1, 0, 0, 0, 0],
            [1, 0, 0, 0, 0],
            [1, 0, 0, 0, 1],
            [0, 1, 1, 1, 0],
          ],
          D: [
            [1, 1, 1, 1, 0],
            [0, 1, 0, 0, 1],
            [0, 1, 0, 0, 1],
            [0, 1, 0, 0, 1],
            [0, 1, 0, 0, 1],
            [0, 1, 0, 0, 1],
            [1, 1, 1, 1, 0],
          ],
          E: [
            [1, 1, 1, 1, 1],
            [1, 0, 0, 0, 0],
            [1, 0, 0, 0, 0],
            [1, 1, 1, 1, 0],
            [1, 0, 0, 0, 0],
            [1, 0, 0, 0, 0],
            [1, 1, 1, 1, 1],
          ],
          F: [
            [1, 1, 1, 1, 1],
            [1, 0, 0, 0, 0],
            [1, 0, 0, 0, 0],
            [1, 1, 1, 1, 0],
            [1, 0, 0, 0, 0],
            [1, 0, 0, 0, 0],
            [1, 0, 0, 0, 0],
          ],
          G: [
            [0, 1, 1, 1, 0],
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 0],
            [1, 0, 1, 1, 1],
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 1],
            [0, 1, 1, 1, 0],
          ],
          H: [
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 1],
            [1, 1, 1, 1, 1],
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 1],
          ],
          I: [
            [0, 1, 1, 1, 0],
            [0, 0, 1, 0, 0],
            [0, 0, 1, 0, 0],
            [0, 0, 1, 0, 0],
            [0, 0, 1, 0, 0],
            [0, 0, 1, 0, 0],
            [0, 1, 1, 1, 0],
          ],
          J: [
            [0, 0, 1, 1, 1],
            [0, 0, 0, 1, 0],
            [0, 0, 0, 1, 0],
            [0, 0, 0, 1, 0],
            [0, 0, 0, 1, 0],
            [1, 0, 0, 1, 0],
            [0, 1, 1, 0, 0],
          ],
          K: [
            [1, 0, 0, 0, 1],
            [1, 0, 0, 1, 0],
            [1, 0, 1, 0, 0],
            [1, 1, 0, 0, 0],
            [1, 0, 1, 0, 0],
            [1, 0, 0, 1, 0],
            [1, 0, 0, 0, 1],
          ],
          L: [
            [1, 0, 0, 0, 0],
            [1, 0, 0, 0, 0],
            [1, 0, 0, 0, 0],
            [1, 0, 0, 0, 0],
            [1, 0, 0, 0, 0],
            [1, 0, 0, 0, 0],
            [1, 1, 1, 1, 1],
          ],
          M: [
            [1, 0, 0, 0, 1],
            [1, 1, 0, 1, 1],
            [1, 0, 1, 0, 1],
            [1, 0, 1, 0, 1],
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 1],
          ],
          N: [
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 1],
            [1, 1, 0, 0, 1],
            [1, 0, 1, 0, 1],
            [1, 0, 0, 1, 1],
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 1],
          ],
          O: [
            [0, 1, 1, 1, 0],
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 1],
            [0, 1, 1, 1, 0],
          ],
          P: [
            [1, 1, 1, 1, 0],
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 1],
            [1, 1, 1, 1, 0],
            [1, 0, 0, 0, 0],
            [1, 0, 0, 0, 0],
            [1, 0, 0, 0, 0],
          ],
          Q: [
            [0, 1, 1, 1, 0],
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 1],
            [1, 0, 1, 0, 1],
            [1, 0, 0, 1, 0],
            [0, 1, 1, 0, 1],
          ],
          R: [
            [1, 1, 1, 1, 0],
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 1],
            [1, 1, 1, 1, 0],
            [1, 0, 1, 0, 0],
            [1, 0, 0, 1, 0],
            [1, 0, 0, 0, 1],
          ],
          S: [
            [0, 1, 1, 1, 0],
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 0],
            [0, 1, 1, 1, 0],
            [0, 0, 0, 0, 1],
            [1, 0, 0, 0, 1],
            [0, 1, 1, 1, 0],
          ],
          T: [
            [1, 1, 1, 1, 1],
            [0, 0, 1, 0, 0],
            [0, 0, 1, 0, 0],
            [0, 0, 1, 0, 0],
            [0, 0, 1, 0, 0],
            [0, 0, 1, 0, 0],
            [0, 0, 1, 0, 0],
          ],
          U: [
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 1],
            [0, 1, 1, 1, 0],
          ],
          V: [
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 1],
            [0, 1, 0, 1, 0],
            [0, 0, 1, 0, 0],
          ],
          W: [
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 1],
            [1, 0, 1, 0, 1],
            [1, 0, 1, 0, 1],
            [1, 0, 1, 0, 1],
            [0, 1, 0, 1, 0],
          ],
          X: [
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 1],
            [0, 1, 0, 1, 0],
            [0, 0, 1, 0, 0],
            [0, 1, 0, 1, 0],
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 1],
          ],
          Y: [
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 1],
            [0, 1, 0, 1, 0],
            [0, 0, 1, 0, 0],
            [0, 0, 1, 0, 0],
            [0, 0, 1, 0, 0],
            [0, 0, 1, 0, 0],
          ],
          Z: [
            [1, 1, 1, 1, 1],
            [0, 0, 0, 0, 1],
            [0, 0, 0, 1, 0],
            [0, 0, 1, 0, 0],
            [0, 1, 0, 0, 0],
            [1, 0, 0, 0, 0],
            [1, 1, 1, 1, 1],
          ],
          "1": [
            [0, 0, 1, 0, 0],
            [0, 1, 1, 0, 0],
            [0, 0, 1, 0, 0],
            [0, 0, 1, 0, 0],
            [0, 0, 1, 0, 0],
            [0, 0, 1, 0, 0],
            [0, 1, 1, 1, 0],
          ],
          "2": [
            [0, 1, 1, 1, 0],
            [1, 0, 0, 0, 1],
            [0, 0, 0, 0, 1],
            [0, 0, 0, 1, 0],
            [0, 0, 1, 0, 0],
            [0, 1, 0, 0, 0],
            [1, 1, 1, 1, 1],
          ],
          "3": [
            [1, 1, 1, 1, 1],
            [0, 0, 0, 1, 0],
            [0, 0, 1, 0, 0],
            [0, 0, 0, 1, 0],
            [0, 0, 0, 0, 1],
            [1, 0, 0, 0, 1],
            [0, 1, 1, 1, 0],
          ],
          "4": [
            [0, 0, 0, 1, 0],
            [0, 0, 1, 1, 0],
            [0, 1, 0, 1, 0],
            [1, 0, 0, 1, 0],
            [1, 1, 1, 1, 1],
            [0, 0, 0, 1, 0],
            [0, 0, 0, 1, 0],
          ],
          "5": [
            [1, 1, 1, 1, 1],
            [1, 0, 0, 0, 0],
            [1, 1, 1, 1, 0],
            [0, 0, 0, 0, 1],
            [0, 0, 0, 0, 1],
            [1, 0, 0, 0, 1],
            [0, 1, 1, 1, 0],
          ],
          "6": [
            [0, 0, 1, 1, 0],
            [0, 1, 0, 0, 0],
            [1, 0, 0, 0, 0],
            [1, 1, 1, 1, 0],
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 1],
            [0, 1, 1, 1, 0],
          ],
          "7": [
            [1, 1, 1, 1, 1],
            [0, 0, 0, 0, 1],
            [0, 0, 0, 1, 0],
            [0, 0, 1, 0, 0],
            [0, 1, 0, 0, 0],
            [0, 1, 0, 0, 0],
            [0, 1, 0, 0, 0],
          ],
          "8": [
            [0, 1, 1, 1, 0],
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 1],
            [0, 1, 1, 1, 0],
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 1],
            [0, 1, 1, 1, 0],
          ],
          "9": [
            [0, 1, 1, 1, 0],
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 1],
            [0, 1, 1, 1, 1],
            [0, 0, 0, 0, 1],
            [0, 0, 0, 1, 0],
            [0, 1, 1, 0, 0],
          ],
          "0": [
            [0, 1, 1, 1, 0],
            [1, 0, 0, 0, 1],
            [1, 0, 0, 1, 1],
            [1, 0, 1, 0, 1],
            [1, 1, 0, 0, 1],
            [1, 0, 0, 0, 1],
            [0, 1, 1, 1, 0],
          ],
          "?": [
            [0, 1, 1, 1, 0],
            [1, 0, 0, 0, 1],
            [0, 0, 0, 0, 1],
            [0, 0, 0, 1, 0],
            [0, 0, 1, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 1, 0, 0],
          ],
          "!": [
            [0, 0, 1, 0, 0],
            [0, 0, 1, 0, 0],
            [0, 0, 1, 0, 0],
            [0, 0, 1, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 1, 0, 0],
          ],
          ".": [
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 1, 0, 0],
          ],
            ":": [
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 1, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 1, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0],
          ],
          ",": [
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 1, 1, 0, 0],
            [0, 0, 1, 0, 0],
            [0, 1, 0, 0, 0],
          ],
    };
    return characterMap[char.toUpperCase()] || Array.from({ length: 7 }, () =>
      Array.from({ length: 5 }, () => Math.round(Math.random()))
    );
  };

  return (
    <div
      style={{ backgroundColor: "black", color: "white", overflow: "hidden", width: "100vw", height: "100vh", position: "relative", cursor: "none" }}
    >
      {renderSquares()}
      {renderSliders()}
      <div
        onClick={() => setShowPopup(!showPopup)}
        style={{ position: "absolute", bottom: 80, right: 40, width: 50, height: 50, border: "1px solid white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, cursor: "pointer" }}
      >
        ?
      </div>
      {showPopup && (
        <div
          style={{ position: "absolute", top: "10%", left: "10%", width: "80%", backgroundColor: "rgba(0,0,0,0.95)", color: "white", padding: 20, border: "1px solid white", fontFamily: "monospace", fontSize: 14, maxHeight: "80vh", overflowY: "auto" }}
        >
          <strong>Interference – The Silence Between Signals</strong>
          <p>This installation explores how communication breaks down between neurotypical and neurodivergent perspectives. The sections below illustrate distortion through four cognitive dimensions.</p>
          <h4>RECEPTION</h4>
          <p>Reception distortion controls how long the message is visible. Longer exposure makes interpretation harder, symbolizing the difficulty attention-disordered individuals face in sustaining focus.</p>
          <h4>OUTSIDE</h4>
          <p>External stimuli cause visual disruptions that simulate constant distraction from the environment.</p>
          <h4>INSIDE</h4>
          <p>The expansion of the grid symbolizes internal monologues pulling attention inward.</p>
          <h4>FEELING</h4>
          <p>The distortion of character clarity reflects the viewer's mood and interest.</p>
        </div>
      )}
    </div>
  );
};

export default UnifiedGrid;
