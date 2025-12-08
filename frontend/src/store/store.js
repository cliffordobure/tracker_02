import { configureStore } from '@reduxjs/toolkit'
import authReducer from './slices/authSlice'
import adminReducer from './slices/adminSlice'
import managerReducer from './slices/managerSlice'
import parentReducer from './slices/parentSlice'
import schoolsReducer from './slices/schoolsSlice'
import managersReducer from './slices/managersSlice'
import managerStudentsReducer from './slices/managerStudentsSlice'
import managerParentsReducer from './slices/managerParentsSlice'
import managerDriversReducer from './slices/managerDriversSlice'
import managerTeachersReducer from './slices/managerTeachersSlice'
import routesReducer from './slices/routesSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    admin: adminReducer,
    manager: managerReducer,
    parent: parentReducer,
    schools: schoolsReducer,
    managers: managersReducer,
    managerStudents: managerStudentsReducer,
    managerParents: managerParentsReducer,
    managerDrivers: managerDriversReducer,
    managerTeachers: managerTeachersReducer,
    routes: routesReducer,
  },
})

