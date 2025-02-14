"use client";
import { FormEvent, useEffect, useState } from "react";
import { UserInfo, remult, repo } from "remult";
import { Task } from "../shared/task";
import { TasksController } from "../shared/tasksController";
import { authClient } from "@/lib/client";
import { RemultStore } from "@/lib/mobx-remult/remult-store";
import { observer } from "mobx-react-lite";

const taskStore = RemultStore.Get(Task);

const Page = observer(() => {
  const session = authClient.useSession();
  const user = session.data?.user;
  const form = taskStore.form.use();

  const { data: tasks } = taskStore.list.useLive({
    where: {
      completed: undefined,
    },
  });

  useEffect(() => {
    remult.user = {
      ...session.data?.user,
      roles: [session.data?.user.role],
    } as UserInfo;
  }, [session]);

  return (
    <div>
      <h1>Todos</h1>
      <main>
        <div>
          Hello {user?.name}
          {user ? (
            <button onClick={() => authClient.signOut()}>Sign Out</button>
          ) : (
            <button
              onClick={() => authClient.signIn.social({ provider: "github" })}
            >
              Sign in
            </button>
          )}
        </div>
        {taskStore.metadata.apiInsertAllowed() && (
          <form onSubmit={form.submit}>
            <input
              value={form.data?.title || ""}
              placeholder="What needs to be done?"
              onChange={(e) => form.setField("title", e.target.value)}
            />
            {form.errors.title?.map((err) => (
              <div key={err} style={{ color: "red" }}>
                {err}
              </div>
            ))}
            <button disabled={form.saving}>
              {form.saving ? "Adding..." : "Add"}
            </button>
          </form>
        )}
        {tasks?.map((task) => (
          <div key={task.id}>
            <input
              type="checkbox"
              checked={task.completed}
              onChange={(e) => {
                taskStore.list.update(task.id, { completed: e.target.checked });
              }}
            />
            <input
              value={task.title}
              onChange={(e) => {
                taskStore.list.update(task.id, { title: e.target.value });
              }}
            />
            {taskStore.metadata.apiDeleteAllowed() && (
              <button onClick={() => taskStore.list.delete(task.id)}>
                Delete
              </button>
            )}
          </div>
        ))}
        <div>
          <button onClick={(e) => TasksController.setAllCompleted(true)}>
            Set all completed
          </button>
          <button onClick={(e) => TasksController.setAllCompleted(false)}>
            Set all uncompleted
          </button>
        </div>
      </main>
    </div>
  );
});

export default Page;
