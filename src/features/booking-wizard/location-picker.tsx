"use client";

import { useId, useState } from "react";
import { inputClass } from "@/components/ui";
import { areasIn, citiesIn, COUNTRIES } from "@/lib/locations";
import type { Place } from "./state";

const OTHER = "__other__";
const labelClass = "mb-1.5 block text-sm font-medium text-navy";

/**
 * Country → city → area. Cities outside `allowedCities` are shown but disabled, so the importer
 * sees why a place is missing. The area list ends with "Other area…", which opens a text field.
 */
export function LocationPicker({
  legend,
  value,
  onChange,
  allowedCities,
  error,
  icon,
}: {
  legend: string;
  value: Place;
  onChange: (place: Place) => void;
  allowedCities?: Set<string>;
  error?: string;
  icon?: React.ReactNode;
}) {
  const id = useId();
  const areas = areasIn(value.city);
  const [custom, setCustom] = useState(() => Boolean(value.area) && !areas.includes(value.area));
  const isAllowed = (city: string) => !allowedCities || allowedCities.has(city);
  const countryUsable = (country: string) => citiesIn(country).some(isAllowed);

  return (
    <fieldset className={`rounded-xl border p-4 transition ${error ? "border-bad/40 bg-bad-soft/40" : "border-line bg-background/60"}`} aria-describedby={error ? `${id}-error` : undefined}>
      <legend className="flex items-center gap-2 px-1 text-sm font-semibold text-navy">
        {icon}
        {legend}
      </legend>
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="block">
          <span className={labelClass}>Country</span>
          <select
            className={inputClass}
            value={value.country}
            onChange={(event) => {
              setCustom(false);
              onChange({ country: event.target.value, city: "", area: "" });
            }}
          >
            <option value="">Choose a country</option>
            {COUNTRIES.map((country) => (
              <option key={country} value={country} disabled={!countryUsable(country)}>
                {country}{countryUsable(country) ? "" : " (not served)"}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className={labelClass}>City</span>
          <select
            className={inputClass}
            value={value.city}
            disabled={!value.country}
            onChange={(event) => {
              setCustom(false);
              onChange({ ...value, city: event.target.value, area: "" });
            }}
          >
            <option value="">{value.country ? "Choose a city" : "Country first"}</option>
            {citiesIn(value.country).map((city) => (
              <option key={city} value={city} disabled={!isAllowed(city)}>
                {city}{isAllowed(city) ? "" : " (not served)"}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className={labelClass}>Area / sector</span>
          <select
            className={inputClass}
            value={custom ? OTHER : value.area}
            disabled={!value.city}
            onChange={(event) => {
              const next = event.target.value;
              setCustom(next === OTHER);
              onChange({ ...value, area: next === OTHER ? "" : next });
            }}
          >
            <option value="">{value.city ? "Choose an area" : "City first"}</option>
            {areas.map((area) => <option key={area} value={area}>{area}</option>)}
            {value.city ? <option value={OTHER}>Other area…</option> : null}
          </select>
        </label>
      </div>
      {custom ? (
        <label className="mt-3 block animate-fade-in">
          <span className={labelClass}>Area name</span>
          <input
            className={inputClass}
            value={value.area}
            maxLength={120}
            autoFocus
            placeholder="District, sector, street or landmark"
            onChange={(event) => onChange({ ...value, area: event.target.value })}
          />
        </label>
      ) : null}
      {error ? <p id={`${id}-error`} role="alert" className="mt-2 text-sm font-medium text-bad">{error}</p> : null}
    </fieldset>
  );
}
