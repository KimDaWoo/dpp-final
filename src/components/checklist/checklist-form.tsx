"use client";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { useState } from "react";
import { ChecklistSchema } from "@/lib/schemas";

export function ChecklistForm() {
  const form = useForm<z.infer<typeof ChecklistSchema>>({
    resolver: zodResolver(ChecklistSchema),
    defaultValues: { maxRiskPct: 1, entry: 0, stop: 0, target: 0, qty: 0, acct: 0 },
  });
  const [passed, setPassed] = useState(false);

  const onCalc = (v: z.infer<typeof ChecklistSchema>) => {
    if (!v.acct || !v.entry || !v.stop || !v.qty) {
      setPassed(false);
      return;
    }
    const risk = Math.abs(v.entry - v.stop) * v.qty / v.acct * 100; // %
    const ok = risk <= v.maxRiskPct && !!v.target;
    setPassed(ok);
  };

  return (
    <Form {...form}>
      <form
        onChange={() => onCalc(form.getValues())}
        onSubmit={form.handleSubmit(() => {})}
        className="space-y-4"
      >
        <FormField control={form.control} name="entry" render={({ field }) => <FormItem><FormLabel>Entry</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>} />
        <FormField control={form.control} name="stop" render={({ field }) => <FormItem><FormLabel>Stop</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>} />
        <FormField control={form.control} name="target" render={({ field }) => <FormItem><FormLabel>Target</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>} />
        <FormField control={form.control} name="qty" render={({ field }) => <FormItem><FormLabel>Qty</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>} />
        <FormField control={form.control} name="acct" render={({ field }) => <FormItem><FormLabel>Account Size</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>} />
        <FormField control={form.control} name="maxRiskPct" render={({ field }) => <FormItem><FormLabel>Max Risk %</FormLabel><FormControl><Input type="number" step="0.1" {...field} /></FormControl><FormMessage /></FormItem>} />
        <div className="flex gap-2">
          <Button type="submit" variant="secondary">Check</Button>
          <Button type="button" disabled={!passed} onClick={() => window.open("https://www.google.com/finance", "_blank")}>
            Go to Broker
          </Button>
        </div>
      </form>
    </Form>
  );
}
