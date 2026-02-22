"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AccountHeader } from "./account-header";
import { AccountStats } from "./account-stats";
import { ActivityTimeline } from "./activity-timeline";
import { ContactsTab } from "./contacts-tab";
import { OrdersTab } from "./orders-tab";
import { VisitsTab } from "./visits-tab";
import { SamplesTab } from "./samples-tab";
import { CompetitiveIntelTab } from "./competitive-intel-tab";
import { PreferencesTab } from "./preferences-tab";
import { DropSampleModal } from "./drop-sample-modal";
import { AddTaskModal } from "./add-task-modal";
import type { AccountDetail, ContactRow, RepOption } from "@/types";

interface AccountDetailClientProps {
  initialAccount: AccountDetail;
  reps: RepOption[];
  currentUserId: string;
}

export function AccountDetailClient({
  initialAccount,
  reps,
  currentUserId,
}: AccountDetailClientProps) {
  const [account, setAccount] = useState<AccountDetail>(initialAccount);
  const [dropSampleOpen, setDropSampleOpen] = useState(false);
  const [addTaskOpen, setAddTaskOpen] = useState(false);
  const [contacts, setContacts] = useState<ContactRow[]>([]);
  const [contactsLoaded, setContactsLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    async function fetchContacts() {
      try {
        const res = await fetch(`/api/accounts/${account.id}/contacts`);
        if (res.ok) {
          const data = await res.json();
          setContacts(data.contacts);
        }
      } catch {
        // silent
      } finally {
        setContactsLoaded(true);
      }
    }
    fetchContacts();
  }, [account.id]);

  const handleAccountUpdate = (patch: Partial<AccountDetail>) => {
    setAccount((prev) => ({ ...prev, ...patch }));
  };

  const handleSampleSuccess = () => {
    // Optionally refresh activity or samples tab
  };

  const handleTaskSuccess = () => {
    // Optionally refresh activity or tasks
  };

  return (
    <div className="space-y-4">
      {/* Header — always visible */}
      <AccountHeader
        account={account}
        reps={reps}
        onAccountUpdate={handleAccountUpdate}
        onDropSample={() => setDropSampleOpen(true)}
        onAddTask={() => setAddTaskOpen(true)}
      />

      {/* Tabs section */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        {/* Scrollable tab bar for mobile */}
        <ScrollArea className="w-full" type="scroll">
          <TabsList className="flex w-max min-w-full bg-white border border-gray-200 rounded-lg p-1 gap-0.5 h-auto">
            {[
              { value: "overview", label: "Overview" },
              { value: "contacts", label: "Contacts" },
              { value: "orders", label: "Orders" },
              { value: "visits", label: "Visits" },
              { value: "samples", label: "Samples" },
              { value: "competitive", label: "Competitive Intel" },
              { value: "preferences", label: "Preferences" },
            ].map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="px-3 py-1.5 text-sm rounded-md data-[state=active]:bg-[#1B4332] data-[state=active]:text-white whitespace-nowrap"
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </ScrollArea>

        {/* Overview */}
        <TabsContent value="overview" className="space-y-4 mt-4">
          <AccountStats account={account} />
          <div className="bg-white border border-gray-200 rounded-lg p-4 md:p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">
              Activity Timeline
            </h2>
            <ActivityTimeline accountId={account.id} />
          </div>
        </TabsContent>

        {/* Contacts */}
        <TabsContent value="contacts" className="mt-4">
          <div className="bg-white border border-gray-200 rounded-lg p-4 md:p-6">
            <ContactsTab accountId={account.id} />
          </div>
        </TabsContent>

        {/* Orders */}
        <TabsContent value="orders" className="mt-4">
          <div className="bg-white border border-gray-200 rounded-lg p-4 md:p-6">
            <OrdersTab accountId={account.id} />
          </div>
        </TabsContent>

        {/* Visits */}
        <TabsContent value="visits" className="mt-4">
          <div className="bg-white border border-gray-200 rounded-lg p-4 md:p-6">
            <VisitsTab accountId={account.id} />
          </div>
        </TabsContent>

        {/* Samples */}
        <TabsContent value="samples" className="mt-4">
          <div className="bg-white border border-gray-200 rounded-lg p-4 md:p-6">
            <SamplesTab
              accountId={account.id}
              onDropSample={() => setDropSampleOpen(true)}
            />
          </div>
        </TabsContent>

        {/* Competitive Intel */}
        <TabsContent value="competitive" className="mt-4">
          <div className="bg-white border border-gray-200 rounded-lg p-4 md:p-6">
            <CompetitiveIntelTab accountId={account.id} />
          </div>
        </TabsContent>

        {/* Preferences */}
        <TabsContent value="preferences" className="mt-4">
          <div className="bg-white border border-gray-200 rounded-lg p-4 md:p-6">
            <PreferencesTab
              account={account}
              onAccountUpdate={handleAccountUpdate}
            />
          </div>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <DropSampleModal
        open={dropSampleOpen}
        onClose={() => setDropSampleOpen(false)}
        accountId={account.id}
        contacts={contactsLoaded ? contacts : []}
        onSuccess={handleSampleSuccess}
      />
      <AddTaskModal
        open={addTaskOpen}
        onClose={() => setAddTaskOpen(false)}
        accountId={account.id}
        reps={reps}
        currentUserId={currentUserId}
        onSuccess={handleTaskSuccess}
      />
    </div>
  );
}
