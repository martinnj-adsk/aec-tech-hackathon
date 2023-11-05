const colors = [
  "rgba(169, 189, 5, 0.9)",
  "rgba(153, 181, 6, 0.9)",
  "rgba(136, 172, 7, 0.9)",
  "rgba(39, 123, 12, 0.9)",
  "rgba(120, 164, 8, 0.9)",
  "rgba(104, 156, 9, 0.9)",
  "rgba(88, 148, 9, 0.9)",
  "rgba(72, 140, 10, 0.9)",
  "rgba(55, 131, 11, 0.9)",
  "rgba(23, 115, 13, 0.9)",
];

const colors2 = ["red", "green", "blue"];

function getMinMaxNoNaN(arr) {
  return arr.reduce(
    (acc, curr) => {
      if (isNaN(curr)) {
        return acc;
      }
      acc[0] = Math.min(curr, acc[0]);
      acc[1] = Math.max(curr, acc[1]);
      return acc;
    },
    [Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY]
  );
}

export function createNoiseCanvas(noiseResult) {
  const { grid, mask, width, height, scale } = noiseResult;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  let color = undefined;
  for (let i = 0; i < grid.length; i++) {
    if (isNaN(grid[i])) {
      color = "white";
    } else if (grid[i] < 45) {
      color = "green";
    } else if (grid[i] < 50) {
      color = "yellow";
    } else if (grid[i] < 55) {
      color = "orange";
    } else {
      color = "red";
    }
    const x = Math.floor(i % width);
    const y = Math.floor(i / width);
    ctx.fillStyle = color;
    ctx.fillRect(x, y, 1, 1);
  }
  console.log(canvas.toDataURL());
  return canvas;
}
