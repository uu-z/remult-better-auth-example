import { Allow, BackendMethod } from "remult";
import { Task } from "./task";
import { memoryAdapter } from "@/lib/remult-memory";

const remult = memoryAdapter()


export class TasksController {
  @BackendMethod({ allowed: Allow.authenticated })
  static async setAllCompleted(completed: boolean) {
    const taskRepo = remult.repo(Task);
    console.log(await taskRepo.find())

    for (const task of await taskRepo.find()) {

      await taskRepo.save({ ...task, completed });
    }
  }
}
