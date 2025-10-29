/**
 * This file can be used to encapsulate logic related to the legal system simulation,
 * such as rules for different procedures (civil vs. penal), evidence handling,
 * or other game mechanics that are independent of the UI or AI service.
 */

export function getProcedureType(isCivil: boolean): string {
    return isCivil ? "Procedimiento Escrito" : "Juicio Oral";
}
