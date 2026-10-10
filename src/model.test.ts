import { describe, it, expect } from "vitest";
import {
  seed,
  readData,
  validatePet,
  validateBooking,
  type Booking,
} from "./model";
const booking: Booking = {
  id: "1",
  petId: "bomi",
  petName: "보미",
  serviceId: "care",
  date: "2099-01-01",
  time: "10:00",
  cancelled: false,
};
describe("demo data", () => {
  it("starts with isolated accounts and restores a round trip", () => {
    const d = seed();
    d.accounts.hari.bookings.push(booking);
    expect(readData(JSON.stringify(d))).toEqual(d);
    expect(d.accounts.juni.bookings).toHaveLength(0);
  });
  it("rejects corrupted storage and unsupported schema", () => {
    for (const s of ["oops", "null", "{}", '{"version":2,"accounts":{}}'])
      expect(() => readData(s)).toThrow();
    const d = seed();
    d.accounts.hari.pets[0].name = undefined as unknown as string;
    expect(() => readData(JSON.stringify(d))).toThrow();
  });
  it("validates profile name, age and memo", () => {
    const p = seed().accounts.hari.pets[0];
    expect(validatePet(p)).toBe("");
    expect(validatePet({ ...p, name: "  " })).not.toBe("");
    expect(validatePet({ ...p, age: "41" })).not.toBe("");
    expect(validatePet({ ...p, note: "a".repeat(201) })).not.toBe("");
  });
  it("rejects unknown pets, invalid services and past or invalid dates", () => {
    const a = seed().accounts.hari;
    expect(validateBooking(a, booking)).toBe("");
    for (const b of [
      { ...booking, petId: "missing" },
      { ...booking, serviceId: "missing" },
      { ...booking, date: "2020-01-01" },
      { ...booking, date: "2099-02-31" },
      { ...booking, time: "04:00" },
    ])
      expect(validateBooking(a, b)).not.toBe("");
  });
  it("blocks same-day duplicates but allows rebooking after cancellation", () => {
    const a = seed().accounts.hari;
    a.bookings = [booking];
    expect(validateBooking(a, { ...booking, serviceId: "walk" })).not.toBe("");
    a.bookings[0] = { ...booking, cancelled: true };
    expect(validateBooking(a, booking)).toBe("");
  });
});
