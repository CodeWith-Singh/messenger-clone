import getCurrentUser from "@/app/action/getCurrentUser";
import DesktopSidebar from "./DesktopSidebar";
import MobileFotter from "./MobileFotter";

export default async function Sidebar({
  children,
}: {
  children: React.ReactNode;
}) {
  const currentUser = await getCurrentUser();

  return (
    <div className="h-full">
      <DesktopSidebar currentUser={currentUser!}/>
      <MobileFotter/>
      <main className="lg:pl-20 h-full">{children}</main>
    </div>
  );
}
