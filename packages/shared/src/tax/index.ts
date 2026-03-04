export { getCoefficiente, COEFFICIENTI_REDDITIVITA } from "./coefficienti.js";
export type { CoefficienteAteco } from "./coefficienti.js";

export { calcolaImposta } from "./imposta.js";
export type { CalcoloImpostaInput, CalcoloImpostaResult } from "./imposta.js";

export { calcolaInps } from "./inps.js";
export type { CalcoloInpsInput, CalcoloInpsResult, GestioneInps } from "./inps.js";

export { calcolaAccontoSaldo, generaRigheErario, generaRigheInps, SOGLIA_MINIMA_ACCONTI } from "./f24.js";
export type {
  AccontoSaldoInput,
  AccontoSaldoResult,
  GeneraRigheInpsInput,
  F24Data,
  F24SezioneErarioRiga,
  F24SezioneInpsRiga,
} from "./f24.js";
