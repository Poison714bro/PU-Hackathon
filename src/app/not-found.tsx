import Link from "next/link";
import { Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#070a10] text-slate-200">
      <div className="flex max-w-md flex-col items-center space-y-6 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-cyan-500/10">
          <Search className="h-10 w-10 text-cyan-500" />
        </div>
        
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight text-white">Entity Not Found</h2>
          <p className="text-sm text-slate-400">
            The requested intelligence dossier or endpoint could not be located in our active database.
          </p>
        </div>

        <Link
          href="/"
          className="flex items-center gap-2 rounded-lg bg-cyan-500 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-cyan-600 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-[#070a10]"
        >
          Return to Command Center
        </Link>
      </div>
    </div>
  );
}
