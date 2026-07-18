import { useState, useMemo } from "react";
import {
  CreditCard,
  ShoppingCart,
  CheckCircle2,
  Ticket,
  QrCode,
  Sparkles,
  ShieldCheck,
  Wallet,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, Row } from "./AppShell";
import { toast } from "sonner";

type BookedTicket = {
  section: string;
  row: string;
  seat: number;
  price: number;
  bookingRef: string;
};

type Seat = {
  row: string;
  num: number;
  id: string;
  isOccupied: boolean;
  price: number;
};

const SECTIONS = [
  { id: "sec-214", name: "Section 214 (North Stands)", price: 120 },
  { id: "sec-102", name: "Section 102 (VIP West Side)", price: 280 },
  { id: "sec-305", name: "Section 305 (South Goal View)", price: 85 },
];

const ROWS = ["A", "B", "C", "D", "E", "F"];
const SEATS_PER_ROW = 12;

export function SeatBookingEngine() {
  const [selectedSectionId, setSelectedSectionId] = useState("sec-214");
  const [selectedSeats, setSelectedSeats] = useState<Seat[]>([]);
  const [step, setStep] = useState<"grid" | "payment" | "booking" | "success">("grid");
  const [paymentMethod, setPaymentMethod] = useState<"card" | "wallet" | "gpay">("card");

  // Form states
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");

  // Final ticket storage
  const [completedTickets, setCompletedTickets] = useState<BookedTicket[]>([]);
  const [bookingRef, setBookingRef] = useState("");

  const activeSection = useMemo(() => {
    return SECTIONS.find((s) => s.id === selectedSectionId) || SECTIONS[0];
  }, [selectedSectionId]);

  // Generate deterministic seat grid based on section selection
  const seatGrid = useMemo(() => {
    const list: Seat[] = [];
    ROWS.forEach((row) => {
      for (let num = 1; num <= SEATS_PER_ROW; num++) {
        // Deterministic occupancy based on char codes and numbers
        const hash = (row.charCodeAt(0) * 7 + num * 13 + activeSection.price) % 100;
        const isOccupied = hash < 45; // ~45% occupied

        list.push({
          row,
          num,
          id: `${selectedSectionId}-${row}-${num}`,
          isOccupied,
          price: activeSection.price,
        });
      }
    });
    return list;
  }, [selectedSectionId, activeSection]);

  const handleSeatClick = (seat: Seat) => {
    if (seat.isOccupied) return;

    const isAlreadySelected = selectedSeats.some((s) => s.id === seat.id);
    if (isAlreadySelected) {
      setSelectedSeats((prev) => prev.filter((s) => s.id !== seat.id));
    } else {
      if (selectedSeats.length >= 6) {
        toast.error("Maximum of 6 seats can be booked per transaction.");
        return;
      }
      setSelectedSeats((prev) => [...prev, seat]);
    }
  };

  const subtotal = selectedSeats.reduce((sum, s) => sum + s.price, 0);
  const bookingFee = selectedSeats.length * 4.5;
  const grandTotal = subtotal + bookingFee;

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Basic auto-formatting for 16-digit card number
    const val = e.target.value.replace(/\D/g, "").slice(0, 16);
    const formatted = val.replace(/(\d{4})(?=\d)/g, "$1 ");
    setCardNumber(formatted);
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "").slice(0, 4);
    if (val.length >= 2) {
      setCardExpiry(`${val.slice(0, 2)}/${val.slice(2)}`);
    } else {
      setCardExpiry(val);
    }
  };

  const submitPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (paymentMethod === "card") {
      if (!cardName || cardNumber.length < 19 || cardExpiry.length < 5 || cardCvv.length < 3) {
        toast.error("Please enter valid card payment information.");
        return;
      }
    }

    setStep("booking");

    // Simulate booking creation delay
    setTimeout(() => {
      const generatedRef = `ARENA-WCF-${Math.floor(100000 + Math.random() * 900000)}`;
      const newTickets: BookedTicket[] = selectedSeats.map((s) => ({
        section: activeSection.name.replace(/ \(.*\)/, ""),
        row: s.row,
        seat: s.num,
        price: s.price,
        bookingRef: generatedRef,
      }));

      setCompletedTickets(newTickets);
      setBookingRef(generatedRef);
      setStep("success");
      toast.success("FIFA Tickets booked successfully! Confirmation sent to email.");
    }, 2000);
  };

  const resetSelection = () => {
    setSelectedSeats([]);
    setStep("grid");
    setCardName("");
    setCardNumber("");
    setCardExpiry("");
    setCardCvv("");
  };

  return (
    <div className="space-y-6">
      {/* Step Progress Tracker */}
      <div className="flex items-center justify-between px-2 text-xs font-semibold text-muted-foreground border-b border-border pb-4">
        <span className={cn(step === "grid" ? "text-primary" : "text-muted-foreground/80")}>
          1. Select Seats
        </span>
        <span className="h-[1px] flex-1 mx-3 bg-border" />
        <span className={cn(step === "payment" ? "text-primary" : "text-muted-foreground/80")}>
          2. Checkout & Payment
        </span>
        <span className="h-[1px] flex-1 mx-3 bg-border" />
        <span
          className={cn(step === "success" ? "text-success font-bold" : "text-muted-foreground/80")}
        >
          3. Ticket Confirmed
        </span>
      </div>

      {step === "grid" && (
        <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          {/* Seating Grid Column */}
          <Card>
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
              <div>
                <h3 className="text-sm font-semibold">Select Your Seats</h3>
                <p className="text-xs text-muted-foreground">
                  Tap available green seats to toggle selection.
                </p>
              </div>
              <select
                value={selectedSectionId}
                onChange={(e) => {
                  setSelectedSectionId(e.target.value);
                  setSelectedSeats([]);
                }}
                className="rounded-xl border border-border bg-secondary/50 px-3 py-1.5 text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {SECTIONS.map((sec) => (
                  <option key={sec.id} value={sec.id}>
                    {sec.name} · ${sec.price}/seat
                  </option>
                ))}
              </select>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground mb-6 bg-secondary/20 p-3 rounded-2xl border border-border/40">
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded bg-success" /> Available
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded bg-accent" /> Occupied
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded bg-primary" /> Selected
              </span>
            </div>

            {/* Simulated Pitch Side Marker */}
            <div className="w-full h-8 bg-success/20 rounded-xl border border-success/30 flex items-center justify-center text-[10px] font-bold text-success-foreground uppercase tracking-widest mb-8">
              ⚽ Pitch Side / Field of Play ⚽
            </div>

            {/* Seating Grid Map */}
            <div className="overflow-x-auto pb-4">
              <div className="min-w-[480px] space-y-2">
                {ROWS.map((row) => {
                  const rowSeats = seatGrid.filter((s) => s.row === row);
                  return (
                    <div key={row} className="flex items-center gap-2">
                      {/* Row Label */}
                      <span className="w-6 text-xs font-bold text-muted-foreground text-center tabular-nums">
                        {row}
                      </span>

                      {/* Row Seats */}
                      <div className="grid grid-cols-12 gap-1.5 flex-1">
                        {rowSeats.map((seat) => {
                          const isSelected = selectedSeats.some((s) => s.id === seat.id);
                          return (
                            <button
                              key={seat.id}
                              disabled={seat.isOccupied}
                              onClick={() => handleSeatClick(seat)}
                              className={cn(
                                "aspect-square rounded-lg flex items-center justify-center text-[10px] font-semibold transition-all select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                                seat.isOccupied
                                  ? "bg-accent/40 text-accent-foreground/50 cursor-not-allowed"
                                  : isSelected
                                    ? "bg-primary text-primary-foreground scale-105 shadow-md"
                                    : "bg-success/70 text-success-foreground hover:bg-success hover:scale-[1.03]",
                              )}
                              aria-label={`Row ${row} Seat ${seat.num}, $${seat.price}${seat.isOccupied ? ", Occupied" : isSelected ? ", Selected" : ", Available"}`}
                              aria-pressed={isSelected}
                            >
                              {seat.num}
                            </button>
                          );
                        })}
                      </div>

                      {/* Row Label Right */}
                      <span className="w-6 text-xs font-bold text-muted-foreground text-center tabular-nums">
                        {row}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>

          {/* Cart / Sidebar Column */}
          <div className="space-y-4">
            <Card>
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <ShoppingCart className="h-4.5 w-4.5 text-primary" /> Ticket Basket
              </h3>

              {selectedSeats.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                  <Ticket className="h-10 w-10 opacity-30 mb-2" />
                  <p className="text-xs">No seats selected yet</p>
                  <p className="text-[10px] mt-1 max-w-[200px]">
                    Select seats in the interactive grid to add them here.
                  </p>
                </div>
              ) : (
                <div className="mt-4 space-y-4">
                  {/* Selected Seats Items list */}
                  <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                    {selectedSeats.map((s) => (
                      <div
                        key={s.id}
                        className="flex items-center justify-between rounded-xl bg-secondary/50 p-2.5 text-xs border border-border/40"
                      >
                        <div>
                          <span className="font-bold text-foreground">
                            Row {s.row} · Seat {s.num}
                          </span>
                          <span className="block text-[10px] text-muted-foreground">
                            {activeSection.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-foreground">${s.price}</span>
                          <button
                            onClick={() =>
                              setSelectedSeats((prev) => prev.filter((p) => p.id !== s.id))
                            }
                            className="text-destructive font-medium hover:underline text-[10px]"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pricing Details breakdown */}
                  <div className="border-t border-border pt-4 space-y-2 text-xs">
                    <Row
                      label={`Tickets Subtotal (${selectedSeats.length})`}
                      value={`$${subtotal.toFixed(2)}`}
                    />
                    <Row label="FIFA Security Booking Fee" value={`$${bookingFee.toFixed(2)}`} />
                    <div className="border-t border-dashed border-border pt-2">
                      <Row
                        label="Grand Total"
                        value={
                          <span className="text-sm font-extrabold text-foreground tabular-nums">
                            ${grandTotal.toFixed(2)}
                          </span>
                        }
                      />
                    </div>
                  </div>

                  {/* Checkout CTA */}
                  <button
                    onClick={() => setStep("payment")}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary py-3 text-xs font-semibold text-primary-foreground hover:opacity-95 transition-all"
                  >
                    <span>Proceed to Checkout</span>
                    <ArrowLeft className="h-4 w-4 rotate-180" />
                  </button>
                </div>
              )}
            </Card>

            <Card className="bg-gradient-to-br from-accent/5 to-transparent border border-accent/20">
              <h4 className="text-xs font-bold uppercase tracking-wider text-accent flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5" /> FIFA Mobile Ticketing
              </h4>
              <p className="mt-1.5 text-xs leading-relaxed text-foreground/80">
                All bookings generate encrypted digital tickets synced directly to your companion
                app. No paper tickets needed. Enter via express NFC gates.
              </p>
            </Card>
          </div>
        </div>
      )}

      {step === "payment" && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Order Summary Checkout Card */}
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <button
                onClick={() => setStep("grid")}
                className="p-1 hover:bg-secondary rounded-full border border-border/40 transition-colors"
                aria-label="Back to seats"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <h3 className="text-sm font-semibold">Order Summary</h3>
            </div>

            <div className="space-y-3">
              <div className="rounded-xl bg-secondary/30 border border-border p-3 space-y-1.5 text-xs">
                <div className="flex justify-between font-bold text-foreground">
                  <span>Match Tickets × {selectedSeats.length}</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="text-[10px] text-muted-foreground">{activeSection.name}</div>
                <div className="space-y-1 pt-1.5 max-h-24 overflow-y-auto">
                  {selectedSeats.map((s) => (
                    <div
                      key={s.id}
                      className="flex justify-between text-muted-foreground text-[11px]"
                    >
                      <span>
                        Row {s.row}, Seat {s.num}
                      </span>
                      <span>${s.price}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2 text-xs border-t border-border pt-3">
                <Row label="Tickets Subtotal" value={`$${subtotal.toFixed(2)}`} />
                <Row label="FIFA Security Booking Fee" value={`$${bookingFee.toFixed(2)}`} />
                <div className="border-t border-dashed border-border pt-2">
                  <Row
                    label="Amount Due"
                    value={
                      <span className="text-base font-extrabold text-foreground tabular-nums">
                        ${grandTotal.toFixed(2)}
                      </span>
                    }
                  />
                </div>
              </div>

              <div className="rounded-xl bg-success/10 border border-success/20 p-3.5 text-xs text-success flex items-start gap-2.5">
                <ShieldCheck className="h-4.5 w-4.5 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold block">Official Authorized Reseller</span>
                  <p className="text-[10.5px] mt-0.5 leading-relaxed text-success-foreground opacity-90">
                    This ticket portal is authenticated by FIFA ticketing servers. Face-value prices
                    are guaranteed.
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Interactive Mock Payment Form */}
          <Card>
            <h3 className="text-sm font-semibold mb-4">Select Payment Method</h3>
            <div className="grid grid-cols-3 gap-2 mb-5">
              <button
                type="button"
                onClick={() => setPaymentMethod("card")}
                className={cn(
                  "flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-semibold gap-1.5 transition-all focus-visible:outline-none focus-visible:ring-2",
                  paymentMethod === "card"
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border bg-secondary/20 hover:bg-secondary text-muted-foreground",
                )}
              >
                <CreditCard className="h-5 w-5" />
                <span>Credit Card</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod("wallet")}
                className={cn(
                  "flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-semibold gap-1.5 transition-all focus-visible:outline-none focus-visible:ring-2",
                  paymentMethod === "wallet"
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border bg-secondary/20 hover:bg-secondary text-muted-foreground",
                )}
              >
                <Wallet className="h-5 w-5" />
                <span>Arena Wallet</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setPaymentMethod("gpay");
                  toast.success(
                    "Apple Pay / Google Pay selected. Double-tap side button to mock complete.",
                  );
                }}
                className={cn(
                  "flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-semibold gap-1.5 transition-all focus-visible:outline-none focus-visible:ring-2",
                  paymentMethod === "gpay"
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border bg-secondary/20 hover:bg-secondary text-muted-foreground",
                )}
              >
                <Sparkles className="h-5 w-5" />
                <span>GPay / Apple</span>
              </button>
            </div>

            <form onSubmit={submitPayment} className="space-y-4">
              {paymentMethod === "card" && (
                <>
                  <div className="space-y-1.5">
                    <label
                      htmlFor="cardName"
                      className="text-[11px] font-bold uppercase text-muted-foreground"
                    >
                      Cardholder Name
                    </label>
                    <input
                      id="cardName"
                      type="text"
                      required
                      placeholder="e.g. Lionel Messi"
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                      className="w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="cardNumber"
                      className="text-[11px] font-bold uppercase text-muted-foreground"
                    >
                      Card Number
                    </label>
                    <input
                      id="cardNumber"
                      type="text"
                      required
                      placeholder="4000 1234 5678 9010"
                      value={cardNumber}
                      onChange={handleNumberChange}
                      className="w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label
                        htmlFor="cardExpiry"
                        className="text-[11px] font-bold uppercase text-muted-foreground"
                      >
                        Expiry Date
                      </label>
                      <input
                        id="cardExpiry"
                        type="text"
                        required
                        placeholder="MM/YY"
                        value={cardExpiry}
                        onChange={handleExpiryChange}
                        className="w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label
                        htmlFor="cardCvv"
                        className="text-[11px] font-bold uppercase text-muted-foreground"
                      >
                        CVV / CVC
                      </label>
                      <input
                        id="cardCvv"
                        type="password"
                        required
                        placeholder="***"
                        maxLength={3}
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ""))}
                        className="w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>
                </>
              )}

              {paymentMethod === "wallet" && (
                <div className="rounded-2xl border border-border bg-secondary/30 p-4 space-y-2 text-xs">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Current Wallet Balance:</span>
                    <span className="font-bold text-foreground">$325.00</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Transaction Total:</span>
                    <span className="font-bold text-foreground">-${grandTotal.toFixed(2)}</span>
                  </div>
                  <div className="border-t border-border pt-2 flex justify-between font-bold text-success">
                    <span>Remaining Balance:</span>
                    <span>${(325.0 - grandTotal).toFixed(2)}</span>
                  </div>
                </div>
              )}

              {paymentMethod === "gpay" && (
                <div className="rounded-2xl border border-dashed border-border bg-secondary/15 p-6 text-center text-xs text-muted-foreground">
                  <Sparkles className="h-8 w-8 mx-auto text-primary mb-2 opacity-60" />
                  <p className="font-semibold text-foreground">Google Pay / Apple Pay Enabled</p>
                  <p className="mt-1 leading-relaxed max-w-xs mx-auto">
                    Biometric fingerprint or facial scanning is ready. Pressing the booking button
                    below simulates standard phone-authorized double-tap validation.
                  </p>
                </div>
              )}

              {/* Pay Button CTA */}
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary py-3 text-xs font-semibold text-primary-foreground hover:opacity-95 transition-all"
              >
                <CreditCard className="h-4.5 w-4.5" />
                <span>Pay & Confirm Booking (${grandTotal.toFixed(2)})</span>
              </button>
            </form>
          </Card>
        </div>
      )}

      {step === "booking" && (
        <Card className="flex flex-col items-center justify-center py-16 text-center min-h-[350px]">
          <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
          <h3 className="text-base font-semibold">Creating Booking Tickets</h3>
          <p className="mt-1 text-xs text-muted-foreground max-w-xs leading-relaxed">
            Securing selected seats in the ticketing blockchain, authorizing the payment proxy, and
            preparing your unique NFC-encrypted passcodes.
          </p>
        </Card>
      )}

      {step === "success" && (
        <div className="max-w-xl mx-auto space-y-6">
          <Card className="text-center py-8">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-success/15 text-success mx-auto mb-4">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-success">Booking Successfully Confirmed!</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Order Ref: <span className="font-mono font-bold text-foreground">{bookingRef}</span>
            </p>

            <p className="mt-3 text-xs text-foreground/80 max-w-xs mx-auto leading-relaxed">
              Congratulations! Your seat tickets are officially reserved. They have been added to
              your profile and will be accessible offline in the stadium.
            </p>
          </Card>

          {/* Render digital ticket passes */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1">
              Your Electronic Entry Passes ({completedTickets.length})
            </h4>
            {completedTickets.map((t, index) => (
              <div
                key={index}
                className="relative overflow-hidden rounded-3xl border border-border bg-surface-elevated shadow-md flex flex-col sm:flex-row"
              >
                {/* Left side: ticket metadata */}
                <div className="flex-1 p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[9px] font-bold uppercase tracking-widest text-primary">
                        FIFA WORLD CUP 2026
                      </span>
                      <h5 className="text-sm font-bold mt-0.5">Match Day Pass</h5>
                    </div>
                    <span className="text-[10px] bg-secondary border border-border rounded-full px-2.5 py-0.5 font-bold text-muted-foreground">
                      Pass {index + 1}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-3 border-t border-b border-border/60 py-3 text-center">
                    <div>
                      <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">
                        Stand
                      </span>
                      <span className="block font-bold text-xs mt-0.5 text-foreground truncate">
                        North Upper
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">
                        Section
                      </span>
                      <span className="block font-bold text-xs mt-0.5 text-foreground">214</span>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">
                        Row / Seat
                      </span>
                      <span className="block font-bold text-xs mt-0.5 text-foreground">
                        {t.row} · {t.seat}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <div>
                      <span className="text-[9px] uppercase text-muted-foreground block">
                        Gate Entry
                      </span>
                      <span className="font-bold text-foreground">Gate B · Level 2</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] uppercase text-muted-foreground block">
                        Reseller price
                      </span>
                      <span className="font-bold text-foreground">${t.price} USD</span>
                    </div>
                  </div>
                </div>

                {/* Simulated ticket tear divider */}
                <div
                  className="hidden sm:flex flex-col justify-between items-center py-2 relative"
                  aria-hidden="true"
                >
                  <div className="absolute top-0 w-4 h-2 rounded-b-full bg-background border-b border-l border-r border-border -mt-1" />
                  <div className="h-full border-r border-dashed border-border" />
                  <div className="absolute bottom-0 w-4 h-2 rounded-t-full bg-background border-t border-l border-r border-border -mb-1" />
                </div>

                {/* Right side: QR scanner */}
                <div className="w-full sm:w-40 bg-secondary/30 p-5 flex flex-col items-center justify-center border-t sm:border-t-0 sm:border-l border-border/60">
                  <div className="bg-white p-2.5 rounded-2xl border border-border/80 shadow-inner">
                    <QrCode className="h-20 w-20 text-black stroke-[1.25]" />
                  </div>
                  <span className="mt-2 text-[9px] font-mono tracking-widest text-muted-foreground">
                    {t.bookingRef}
                  </span>
                  <div className="mt-2.5 flex items-center gap-1.5 text-[10px] text-primary font-bold">
                    <Sparkles className="h-3.5 w-3.5" /> Tap NFC at turnstile
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => {
                toast.success("Adding ticket pass to Google Wallet / Apple Pay simulation...");
              }}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-black dark:bg-white text-white dark:text-black py-3 text-xs font-semibold hover:opacity-90 transition-all"
            >
              <Ticket className="h-4.5 w-4.5" />
              <span>Add to Mobile Wallet</span>
            </button>
            <button
              onClick={resetSelection}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-border bg-secondary/40 py-3 text-xs font-semibold hover:bg-secondary/60 transition-all"
            >
              <span>Book More Seats</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
