// SelectField component: renders a label and a select dropdown with options
export class SelectField {
  constructor({id, label, options = [], required = false, errorMessage = "Please select an option"}) {
    this.id = id;
    this.label = label;
    this.options = options; // array of {value, text}
    this.required = required;
    this.errorMessage = errorMessage;
  }

  render() {
    const wrapper = document.createElement("div");
    const label = document.createElement("label");
    label.htmlFor = this.id;
    label.textContent = this.label;
    const select = document.createElement("select");
    select.id = this.id;
    select.name = this.id;
    if (this.required) select.required = true;
    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = "Select...";
    defaultOption.disabled = true;
    defaultOption.selected = true;
    select.appendChild(defaultOption);
    this.options.forEach(opt => {
      const option = document.createElement("option");
      option.value = opt.value;
      option.textContent = opt.text;
      select.appendChild(option);
    });
    const error = document.createElement("div");
    error.className = "error";
    error.id = `${this.id}-error`;
    error.textContent = this.errorMessage;
    error.style.display = "none";
    select.addEventListener("change", () => {
      if (select.checkValidity()) {
        error.style.display = "none";
      } else {
        error.style.display = "block";
      }
    });
    wrapper.appendChild(label);
    wrapper.appendChild(select);
    wrapper.appendChild(error);
    return wrapper;
  }
}
