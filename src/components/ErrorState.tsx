import React from "react";
export default function ErrorState({ message = "Something went wrong." }: { message?: string }) {
  return <div className="p-6 text-red-600">Error: {message}</div>;
}
