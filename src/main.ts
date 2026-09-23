import "./style.css";
import { setupInputs } from "./input.ts";
import { setupCharges } from "./charges.ts";
import { setupShellField } from "./shell-type.ts";
import { setupLabelField } from "./label.ts";
import { setupCalculations } from "./calculate.ts";

setupInputs();
setupCharges();
setupShellField();
setupLabelField();
setupCalculations();

export function blurAll(): void {
    const tmp = document.createElement("input");
    document.body.appendChild(tmp);
    tmp.focus();
    document.body.removeChild(tmp);
}
