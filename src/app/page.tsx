"use client"
import { FormEvent, useEffect, useState } from "react"
import { UserInfo, remult, repo} from "remult"
import { Task } from "../shared/task"
import { TasksController } from "../shared/tasksController"
import { authClient } from "@/lib/client"

const taskRepo = repo(Task)

export default function Page() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [newTaskTitle, setNewTaskTitle] = useState("")

  const session = authClient.useSession()

  const user = session.data?.user

  useEffect(() => {
    console.log(session)
      remult.user = {...session.data?.user, roles: [session.data?.user.role]} as UserInfo
      return taskRepo
        .liveQuery({
          where: {
            completed: undefined
          }
        })
        .subscribe((info) => setTasks(info.applyChanges))
  }, [session])


  async function addTask(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    try {
      const newTask = await taskRepo.insert({ title: newTaskTitle })
      setNewTaskTitle("")
    } catch (error: any) {
      alert(error.message)
    }
  }

  async function setAllCompleted(completed: boolean) {
    await TasksController.setAllCompleted(completed)
  }

  return (
    <div>
      <h1>Todos</h1>
      <main>
        <div>
          Hello {user?.name}
          {user ?
            <button onClick={() => authClient.signOut()}>Sign Out</button> :
            <button onClick={() => authClient.signIn.social({provider: "github"})}>Sign in</button>}
        </div>
        {taskRepo.metadata.apiInsertAllowed() && (
          <form onSubmit={(e) => addTask(e)}>
            <input
              value={newTaskTitle}
              placeholder="What needs to be done?"
              onChange={(e) => setNewTaskTitle(e.target.value)}
            />
            <button>Add</button>
          </form>
        )}
        {tasks.map((task) => {
          async function deleteTask() {
            try {
              await taskRepo.delete(task)
              setTasks((tasks) => tasks.filter((t) => t !== task))
            } catch (error: any) {
              alert(error.message)
            }
          }
          function setTask(value: Task) {
            setTasks((tasks) => tasks.map((t) => (t === task ? value : t)))
          }
          async function setCompleted(completed: boolean) {
            setTask(await taskRepo.save({ ...task, completed }))
          }
          function setTitle(title: string) {
            setTask({ ...task, title })
          }

          async function doSaveTask() {
            try {
              setTask(await taskRepo.save(task))
            } catch (error: any) {
              alert(error.message)
            }
          }

          return (
            <div key={task.id}>
              <input
                type="checkbox"
                checked={task.completed}
                onChange={(e) => setCompleted(e.target.checked)}
              />
              <input
                value={task.title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <button onClick={() => doSaveTask()}>Save</button>
              {taskRepo.metadata.apiDeleteAllowed() && (
                <button onClick={() => deleteTask()}>Delete</button>
              )}
            </div>
          )
        })}
        <div>
          <button onClick={(e) => setAllCompleted(true)}>
            Set all completed
          </button>
          <button onClick={(e) => setAllCompleted(false)}>
            Set all uncompleted
          </button>
        </div>
      </main>
    </div>
  )
}
