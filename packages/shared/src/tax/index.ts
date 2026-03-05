export { getCoefficiente, COEFFICIENTI_REDDITIVITA } from "./coefficienti.js";
export type { CoefficienteAteco } from "./coefficienti.js";

export { calcolaImposta } from "./imposta.js";
export type { CalcoloImpostaInput, CalcoloImpostaResult } from "./imposta.js";

export { calcolaInps } from "./inps.js";
export type { CalcoloInpsInput, CalcoloInpsResult, GestioneInps } from "./inps.js";

export { calcolaAccontoSaldo, calcolaAccontiInps, generaRigheErario, generaRigheInps, SOGLIA_MINIMA_ACCONTI, SOGLIA_DOPPIO_ACCONTO } from "./f24.js";
export type {
  AccontoSaldoInput,
  AccontoSaldoResult,
  AccontiInpsInput,
  AccontiInpsResult,
  GeneraRigheInpsInput,
  F24Data,
  F24SezioneErarioRiga,
  F24SezioneInpsRiga,
} from "./f24.js";
