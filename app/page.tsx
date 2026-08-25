import RoleplaySession from "@/components/roleplay/RoleplaySession";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex flex-1 w-full max-w-3xl flex-col items-center gap-10 py-16 px-6">
        <h1 className="text-2xl font-semibold">DECA AI Coach — MTDM Practice</h1>
        <RoleplaySession />
      </main>
    </div>
  );
}
