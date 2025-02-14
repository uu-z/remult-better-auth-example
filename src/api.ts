import { remultNextApp } from 'remult/remult-next'
import { Task } from './shared/task'
import { TasksController } from './shared/tasksController'
import { auth } from './auth'
import { UserInfo } from 'remult'
import { Product } from './shared/product'

export const api = remultNextApp({
  entities: [Task, Product],
  controllers: [TasksController],
  getUser: async (req) => {
    const session = await auth.api.getSession({ headers: req.headers })
    return { ...session?.user, roles: [session?.user.role] } as UserInfo
  },
})
