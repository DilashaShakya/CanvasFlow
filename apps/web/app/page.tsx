import Link from "next/link";
import { ArrowRight, Palette, Share2, Sparkles, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { OwlLogo } from "@/components/owl-logo";
import { SplashPlayground } from "@/components/splash-playground";

const features = [
  {
    title: "Draw like a notebook",
    description: "Warm paper, brown ink, pencil strokes, shapes, text, and erasing.",
    icon: Palette,
  },
  {
    title: "Share a room instantly",
    description: "Send one link and collaborators land directly in the room without a confusing create-board step.",
    icon: Share2,
  },
  {
    title: "Live creative presence",
    description: "Watch cursors, edits, and sketches move together in realtime.",
    icon: Users,
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#FFFDF8] text-[#2A1810]">
      <div className="absolute inset-0 -z-0 bg-[radial-gradient(#D9CBB8_1.15px,transparent_1.15px)] bg-[size:22px_22px]" />
      <div className="pointer-events-none absolute left-8 top-28 h-24 w-24 rotate-[-12deg] rounded-[2rem] bg-[#F4C56A]/60 blur-sm" />
      <div className="pointer-events-none absolute bottom-20 right-10 h-32 w-32 rotate-12 rounded-full bg-[#E58A3A]/25 blur-sm" />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-8">
        <header className="flex items-center justify-between rounded-[2rem] border-4 border-[#4B2B19] bg-white/88 px-5 py-4 shadow-[8px_8px_0_#6B3F24] backdrop-blur">
          <OwlLogo
            className="[&_p:first-of-type]:text-[#3A2115] [&_p:last-of-type]:text-[#8A6A43]"
            markClassName="border-[#4B2B19]/25"
          />

          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" className="text-[#5D3521] hover:bg-[#F3D9AA]">
                Log in
              </Button>
            </Link>
          </div>
        </header>

        <section className="grid flex-1 items-center gap-12 py-16 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="relative space-y-8">
            <div className="inline-flex rotate-[-2deg] items-center gap-2 rounded-full border-2 border-[#4B2B19] bg-[#FFE7AD] px-4 py-2 text-sm font-bold text-[#4B2B19] shadow-[5px_5px_0_#6B3F24]">
              <Sparkles className="h-4 w-4" />
              Brown sketchbook whiteboard
            </div>

            <div className="space-y-5">
              <h1 className="max-w-4xl text-5xl font-black tracking-[-0.06em] text-[#2A1810] md:text-7xl">
                Sketch, splash, and share ideas live.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-[#6B3F24]">
                CanvasFlow is a collaborative board with dotted paper, warm brown details, and direct room links that let
                people join fast.
              </p>
            </div>

            <div className="flex flex-wrap gap-4">
              <Link href="/register">
                <Button className="h-12 rounded-2xl px-6 shadow-[6px_6px_0_#4B2B19]">
                  Start sketching
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button variant="secondary" className="h-12 rounded-2xl border-[#4B2B19]/30 bg-white px-6 text-[#4B2B19] hover:bg-[#FFF1D0]">
                  Open dashboard
                </Button>
              </Link>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="rounded-[1.6rem] border-2 border-[#4B2B19]/20 bg-white/85 p-4 shadow-[5px_5px_0_rgba(107,63,36,0.22)]"
                >
                  <feature.icon className="h-5 w-5 text-[#A2663A]" />
                  <h3 className="mt-3 font-bold text-[#3A2115]">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[#7B4A2D]">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute -left-5 -top-5 z-10 rotate-[-8deg] rounded-xl bg-[#F4C56A] px-4 py-2 text-sm font-black text-[#4B2B19] shadow-[4px_4px_0_#6B3F24]">
              try it
            </div>
            <div className="absolute -right-4 bottom-10 z-10 rotate-6 rounded-xl bg-[#F7E8C8] px-4 py-2 text-sm font-bold text-[#6B3F24] shadow-[4px_4px_0_#A2663A]">
              click for color
            </div>
            <SplashPlayground />
          </div>
        </section>
      </div>
    </main>
  );
}
