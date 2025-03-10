"use client";
import { useEffect } from "react";
import { remult, UserInfo } from "remult";
import { Task } from "../shared/task";
import { TasksController } from "../shared/tasksController";
import { authClient } from "@/lib/client";
import { observer } from "mobx-react-lite";
import { memoryAdapter, liveProxy } from "@/lib/remult-memory";

// const _remult = remult;  // for http & backend
const _remult = memoryAdapter(); // for pure frontend & memory

const liveClient = liveProxy({
  adapter: _remult,
});

const Page = observer(() => {
  const session = authClient.useSession();
  const user = session.data?.user;

  const { data: tasks } = liveClient.repo(Task).find(); // call frontend memory
  const { data: count } = liveClient.repo(Task).count();

  useEffect(() => {
    setInterval(() => {
      _remult.repo(Task).insert({ title: "test" });
    }, 1000);
  }, []);

  useEffect(() => {
    remult.user = {
      ...session.data?.user,
      roles: [session.data?.user.role],
    } as UserInfo;
  }, [session]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
        <div className="p-6 bg-primary-50 dark:bg-primary-900 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-2xl font-bold text-primary-700 dark:text-primary-300">
            Todo List
          </h1>
          {/* <pre>{JSON.stringify(users, null, 2)}</pre>
          <pre>{JSON.stringify(listUsers.data?.users, null, 2)}</pre> */}

          <div className="mt-4 flex justify-between items-center">
            <p className="text-gray-600 dark:text-gray-300">
              {user ? `Hello, ${user.name}` : "Welcome, Guest"}
            </p>
            {user ? (
              <button
                onClick={() => authClient.signOut()}
                className="btn btn-outline"
              >
                Sign Out
              </button>
            ) : (
              <button
                onClick={() => authClient.signIn.social({ provider: "github" })}
                className="btn btn-primary"
              >
                Sign in with GitHub
              </button>
            )}
          </div>
        </div>

        {/* {remult.repo(Task).metadata.apiInsertAllowed() && (
          <form
            onSubmit={form.submit}
            className="p-6 border-b border-gray-200 dark:border-gray-700"
          >
            <div className="flex space-x-2">
              <input
                className="input flex-grow"
                value={form.data?.title || ""}
                placeholder="What needs to be done?"
                onChange={(e) => form.setField("title", e.target.value)}
              />
              <button
                type="submit"
                disabled={form.saving}
                className="btn btn-primary"
              >
                {form.saving ? "Adding..." : "Add"}
              </button>
            </div>
            {form.errors.title?.map((err) => (
              <div key={err} className="text-red-500 text-sm mt-2">
                {err}
              </div>
            ))}
          </form>
        )} */}

        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {tasks?.map((task) => (
            <div
              key={task.id}
              className="flex items-center p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <input
                type="checkbox"
                className="mr-3 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                checked={task.completed}
                onChange={(e) => {
                  _remult.repo(Task).update(task.id, {
                    completed: e.target.checked,
                  });
                }}
              />
              <input
                className="input flex-grow mr-3"
                value={task.title}
                onChange={(e) => {
                  _remult.repo(Task).update(task.id, { title: e.target.value });
                  // remult.repo(Task).list.update(task.id, { title: e.target.value });
                }}
              />
              {remult.repo(Task).metadata.apiDeleteAllowed() && (
                <button
                  onClick={() => _remult.repo(Task).delete(task.id)}
                  className="btn btn-outline text-red-500 hover:bg-red-50"
                >
                  Delete
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="p-6 bg-gray-50 dark:bg-gray-900 flex space-x-4">
          <button
            onClick={() => TasksController.setAllCompleted(true)}
            className="btn btn-secondary"
          >
            Set all completed
          </button>
          <button
            onClick={() => TasksController.setAllCompleted(false)}
            className="btn btn-outline"
          >
            Set all uncompleted
          </button>
        </div>
      </div>
    </div>
  );
});

export default Page;
