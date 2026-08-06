// FormField component: renders a label, input and error message
export class FormField {
  constructor({id, label, type = "text", placeholder = "", required = false, pattern = null, errorMessage = "Invalid input"}) {
    this.id = id;
    this.label = label;
    this.type = type;
    this.placeholder = placeholder;
    this.required = required;
    this.pattern = pattern;
    this.errorMessage = errorMessage;
  }

  render() {
    const wrapper = document.createElement("div");
    const label = document.createElement("label");
    label.htmlFor = this.id;
    label.textContent = this.label;
    const input = document.createElement("input");
    input.id = this.id;
    input.name = this.id;
    input.type = this.type;
    input.placeholder = this.placeholder;
    if (this.required) input.required = true;
    if (this.pattern) input.pattern = this.pattern;
    const error = document.createElement("div");
    error.className = "error";
    error.id = `${this.id}-error`;
    error.textContent = this.errorMessage;
    error.style.display = "none";
    input.addEventListener("input", () => {
      if (input.checkValidity()) {
        error.style.display = "none";
      } else {
        error.style.display = "block";
      }
    });
    wrapper.appendChild(label);
    wrapper.appendChild(input);
    wrapper.appendChild(error);
    return wrapper;
  }
}
