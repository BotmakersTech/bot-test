import React from "react";

interface ProfileCardProps {
  title: string;
  children: React.ReactNode;
}

export default function ProfileCard({ title, children }: ProfileCardProps) {
  return (
    <div className="flex w-full flex-col gap-6 rounded-[12px] border border-transparent bg-origin-border p-5 lg:h-[611px] lg:w-[749px] [background:linear-gradient(white,white)_padding-box,linear-gradient(to_right,#0162D1,#8C6CFF)_border-box]">
      <h2 className="text-base font-bold text-gray-900 sm:text-lg">{title}</h2>
      {children}
    </div>
  );
}