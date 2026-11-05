import { currenciesLoader } from "./model/currenciesRoute";
import { CurrenciesPage } from "./ui/CurrenciesPage";

export const currenciesRoute = { Component: CurrenciesPage, loader: currenciesLoader };
