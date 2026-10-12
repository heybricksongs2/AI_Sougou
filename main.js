document.addEventListener("DOMContentLoaded", () => {
  let count = 0;
  const button = document.getElementById("count-button");
  const countDisplay = document.getElementById("click-count");

  if (button && countDisplay) {
    button.addEventListener("click", () => {
      count += 1;
      countDisplay.textContent = count;
    });
  }
});
