import React, { useState, useRef } from "react";
import { format } from "date-fns";
import useSWR, { mutate } from "swr";
import fetcher from "@/lib/fetcher";
import SuccessMessage from "@/components/SuccessMessage";
import ErrorMessage from "@/components/ErrorMessage";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useSession } from "next-auth/react";
import { GuestBookEntry } from "@/lib/types/guestbook";
import { DefaultSession } from "next-auth";
import LoginView from "./LoginView";

interface GuestbookEntryProps {
  entry: GuestBookEntry;
  user: DefaultSession["user"];
}

function Entry({ entry, user }: GuestbookEntryProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const deleteEntry = async (e) => {
    e.preventDefault();
    setIsDeleting(true);

    await fetch(`/api/guestbook/${entry.id}`, {
      method: "DELETE",
    });

    mutate("/api/guestbook");
  };

  return (
    <>
      {isDeleting ? (
        <LoadingSpinner />
      ) : (
        <div className="flex flex-col space-y-2">
          <div className="text-gray-700 max-w-none dark:text-gray-300">{entry.body}</div>
          <div className="flex items-center space-x-3">
            <p className="text-sm text-gray-500">{entry.created_by}</p>
            <span className=" text-gray-300 dark:text-gray-700">/</span>
            <p className="text-sm text-gray-300 dark:text-gray-700">
              {format(new Date(entry.updated_at), "d MMM yyyy 'at' h:mm bb")}
            </p>
            {user && entry.created_by === user.name && (
              <>
                <span className="text-gray-300 dark:text-gray-700">/</span>
                <button
                  className="text-sm text-danger-600 dark:text-danger-400"
                  onClick={deleteEntry}
                >
                  Delete
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

enum FORM_STATE {
  "INIT",
  "LOADING",
  "SUCCESS",
  "ERROR",
}

export default function Guestbook({ fallbackData }: { fallbackData: GuestBookEntry[] }) {
  const [form, setForm] = useState<{ state: FORM_STATE; message?: string }>({
    state: FORM_STATE.INIT,
    message: "",
  });
  const inputEl = useRef(null);
  const { data: session } = useSession();
  const { error: entriesError, data: entries } = useSWR<GuestBookEntry[]>(
    "/api/guestbook",
    fetcher,
    {
      fallbackData,
    }
  );

  const leaveEntry = async (e) => {
    e.preventDefault();
    setForm({ state: FORM_STATE.LOADING });

    const res = await fetch("/api/guestbook", {
      body: JSON.stringify({
        body: inputEl.current.value,
      }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    });

    const { error } = await res.json();
    if (error) {
      setForm({
        state: FORM_STATE.ERROR,
        message: error,
      });
      return;
    }

    inputEl.current.value = "";
    mutate("/api/guestbook");
    setForm({
      state: FORM_STATE.SUCCESS,
      message: "You did it! Thank you for signing my guestbook.",
    });
  };

  return (
    <>
      <LoginView message="Login to sign the guestbook." />
      {Boolean(session?.user) && (
        <div className="border-2 border-gray-400 dark:border-gray-600 rounded-md p-6 prose dark:prose-dark lg:prose-xl">
          <form className="w-full my-4" onSubmit={leaveEntry}>
            <textarea
              ref={inputEl}
              aria-label="Your message"
              placeholder="Your message..."
              required
              className="px-4 py-2 my-4 focus:ring-primary-500 focus:border-primary-500 block w-full border-gray-300 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
            <button
              className="px-4 py-2 rounded flex items-center justify-center px-4 font-bold h-8 text-base bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600"
              type="submit"
            >
              {form.state === FORM_STATE.LOADING ? <LoadingSpinner /> : "Sign"}
            </button>
          </form>
          {form.state === FORM_STATE.ERROR && <ErrorMessage>{form.message}</ErrorMessage>}
          {form.state === FORM_STATE.SUCCESS && <SuccessMessage>{form.message}</SuccessMessage>}
        </div>
      )}
      <div className="mt-4 space-y-8">
        {entriesError && (
          <ErrorMessage>
            An unexpected error occurred. The entries are not available for now. Please try again
            later
          </ErrorMessage>
        )}
        {entries ? (
          entries.map((entry) => <Entry key={entry.id} entry={entry} user={session?.user} />)
        ) : (
          <LoadingSpinner />
        )}
      </div>
    </>
  );
}
