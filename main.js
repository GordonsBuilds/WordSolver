const status = document.querySelector("#status");
const button = document.querySelector("#primary-action");

button.addEventListener("click", () => {
  status.textContent = "Starter app initialized and ready for the next step.";
});
