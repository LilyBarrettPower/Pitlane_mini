// Custom setup fields: defined once per vehicle (Vehicle.setupFields),
// with each setup storing its own values (SetUp.customValues).

// "frontRear" = front + rear values, "single" = one value,
// "corners" = a value for each corner (LF, RF, LR, RR)
export type SetupFieldKind = "frontRear" | "single" | "corners";

export type SetupField = {
    _id: string;
    label: string;
    unit?: string;
    kind: SetupFieldKind;
    isActive?: boolean;
};

// Every value a custom field can hold
export type CustomValueParts = {
    front: string;
    rear: string;
    value: string;
    lf: string;
    rf: string;
    lr: string;
    rr: string;
};

export type CustomValuePart = keyof CustomValueParts;

export const CORNERS = [
    { key: "lf", label: "LF" },
    { key: "rf", label: "RF" },
    { key: "lr", label: "LR" },
    { key: "rr", label: "RR" },
] as const;

export const EMPTY_CUSTOM_VALUE: CustomValueParts = {
    front: "",
    rear: "",
    value: "",
    lf: "",
    rf: "",
    lr: "",
    rr: "",
};

// A setup's value for one custom field (all text, e.g. "-1.5°" or "3 turns")
export type SetupCustomValue = { fieldId: string } & Partial<CustomValueParts>;

export type CustomValueMap = Record<string, CustomValueParts>;

// Only fields that haven't been removed
export function activeSetupFields(fields?: SetupField[] | null) {
    return (fields || []).filter((field) => field.isActive !== false);
}

// Array from the API -> lookup by field id (keeps values for removed fields too,
// so saving a setup never throws them away)
export function customValuesToMap(values?: SetupCustomValue[] | null): CustomValueMap {
    const map: CustomValueMap = {};

    for (const item of values || []) {
        map[String(item.fieldId)] = {
            front: item.front || "",
            rear: item.rear || "",
            value: item.value || "",
            lf: item.lf || "",
            rf: item.rf || "",
            lr: item.lr || "",
            rr: item.rr || "",
        };
    }

    return map;
}

export function customValuesFromMap(map: CustomValueMap): SetupCustomValue[] {
    return Object.entries(map).map(([fieldId, item]) => ({ fieldId, ...item }));
}

// The field name with its unit, e.g. "Name (mm)"
export function fieldTitle(field: SetupField) {
    return field.unit ? `${field.label} (${field.unit})` : field.label;
}
