import inquirer from 'inquirer';
import {pool, connectToDb } from './Connection.js';

await connectToDb();
interface Department {
  id: number;
  name: string;
}

interface Role {
  id: number;
  title: string;
  salary: number;
  department_id: number;
}

interface Employee {
  id: number;
  first_name: string;
  last_name: string;
  role_id: number;
  manager_id: number | null;
}

const mainMenu = () => {
  inquirer

  .prompt([
    {
      type: 'list',
      name: 'action',
      message: 'What would you like to do?',
      choices: [
        'View all departments',
        'View all roles',
        'View all employees',
        'view Employees By Manager',
        'view Employees By Department',
        'Add a department',
        'Add a role',
        'Add an employee',
        'Update an employee role',
        'delete Department',
        'delete Role',
        'delete Employee',
        'view Total Utilized Budget',
        'update Employees Manager',
        'Exit'
      ]
    }
  ])

  .then(answer => {
    switch (answer.action) {
        case 'View all departments':
        viewAllDepartments();
        break;
        case 'View all roles':
        viewAllRoles();
        break;
        case 'View all employees':
        viewAllEmployees();
        break;
        case 'Add a department':
        addDepartment();
        break;
        case 'Add a role':
        addRole();
        break;
        case 'Add an employee':
        addEmployee();
        break;
        case 'Update an employee role':
        updateEmployeeRole();
        break;
        case 'view Employees By Manager':
        viewEmployeesByManager();
        break;
        case 'view Employees By Department':
        viewEmployeesByDepartment();
        break;
        case 'delete Department':
        deleteDepartment();
        break;
        case 'delete Role':
        deleteRole();
        break;
        case 'delete Employee':
        deleteEmployee();
        break;
        case 'view Total Utilized Budget':
        viewTotalUtilizedBudget();
        break;
        case 'update Employees Manager':
        updateEmployeesManager();
        break;
       case 'Exit':
        pool.end();
        break;
      default:
        break;
    }
  });
};

const viewAllDepartments = async () => {
  const result = await pool.query('SELECT * FROM department');
  console.table(result.rows);
  mainMenu();
};

const viewAllRoles = async () => {
  const result = await pool.query(`
    SELECT 
      r.id,
      r.title,
      d.name AS department,
      r.salary
      FROM role AS r
      JOIN department AS d
        ON d.id = r.department_id
        ORDER BY r.id ASC`);
  console.table(result.rows);
  mainMenu();
};

const viewAllEmployees = async () => {
  const result = await pool.query(
    `SELECT 
      e.id, 
      e.first_name,
      e.last_name,
      r.title,
      d.name AS department,
      r.salary,
      CONCAT (m.first_name, ' ', m.last_name) AS manager
      FROM employee AS e
      JOIN role AS r
        ON r.id = e.role_id
      JOIN department AS d
        ON d.id = r.department_id
      LEFT JOIN employee AS m
        ON e.manager_id = m.id
        ORDER BY e.id ASC;`
  );
  console.table(result.rows);
  mainMenu();
};

const addDepartment = async () => {
  // const roles = await pool.query('SELECT * FROM role');
  // console.log (roles);
  const answers = await inquirer.prompt([

    {
      type: 'input',
      name: 'name',
      message: 'Enter department name:'
    }
  ]);

  await pool.query('INSERT INTO department (name) VALUES ($1)', [answers.name]);
  console.log(`Department ${answers.name} added.`);
  mainMenu();
};
const addRole = async () => {
  const departmentsResult = await pool.query('SELECT id, name FROM department');
  const departments = departmentsResult.rows;
  
  const departmentChoices = departments.map((department: Department) => ({
    name: department.name,
    value: department.id
  }));
  
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'name',
      message: 'Enter role name:'
    },
    {
      type: 'input',
      name: 'salary',
      message: 'Enter role salary:',
      validate: (value) => {
        const valid = !isNaN(parseFloat(value));
        return valid || 'Please enter a number';
      },
      filter: (value) => parseFloat(value)
    },
    {
      type: 'list',
      name: 'departmentId',
      message: 'Select a department for the role:',
      choices: departmentChoices
    }
  ]);

  await pool.query('INSERT INTO role (title, salary, department_id) VALUES ($1, $2, $3)', [answers.name, answers.salary, answers.departmentId]);
  console.log(`Role ${answers.name} with a salary of ${answers.salary} added to department ${answers.departmentId}.`);
  mainMenu();
};


const addEmployee = async () => {
  const roleResults = await pool.query('SELECT * FROM role');
    const roles = roleResults.rows.map(role => ({ name: role.title, value: role.id }));

    const employeeResults = await pool.query('SELECT * FROM employee');
    const managers = employeeResults.rows.map(emp => ({ name: `${emp.first_name} ${emp.last_name}`, value: emp.id }));
    managers.unshift({ name: 'None', value: null });

  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'firstName',
      message: 'Enter Employee first name:'
    },
    {
      type: 'input',
      name: 'lastName',
      message: 'Enter Employee name:'
    },
    {
      type: 'list',
      name: 'role_id',
      message: 'What is the employees role?',
      choices: roles
    },
    {
      type: 'list',
      name: 'manager_id',
      message: 'who is the employees manager?',
      choices: managers
    }
  ]);

  await pool.query('INSERT INTO employee (first_name, last_name, role_id, manager_id) VALUES ($1, $2, $3, $4)', [answers.firstName, answers.lastName, 1, null]);
  console.log(`Employee ${answers.firstName} ${answers.lastName} added.`);
  mainMenu();
};
const updateEmployeeRole = async () => {
  try {
    const employeesResult = await pool.query('SELECT id, first_name, last_name FROM employee');
    const employees: Employee[] = employeesResult.rows;

    const rolesResult = await pool.query('SELECT id, title FROM role');
    const roles: Role[] = rolesResult.rows;

    const employeeChoices = employees.map(emp => ({
      name: `${emp.first_name} ${emp.last_name}`,
      value: emp.id
    }));
    
    const { employeeId } = await inquirer.prompt([
      {
        type: 'list',
        name: 'employeeId',
        message: 'Select an employee to update:',
        choices: employeeChoices
      }
    ]);

    const roleChoices = roles.map(role => ({
      name: role.title,
      value: role.id
    }));
    
    const { roleId } = await inquirer.prompt([
      {
        type: 'list',
        name: 'roleId',
        message: 'Select a new role for the employee:',
        choices: roleChoices
      }
    ]);

    await pool.query('UPDATE employee SET role_id = $1 WHERE id = $2', [roleId, employeeId]);
    console.log('Employee role updated successfully!');
  } catch (err) {
    console.error('Error updating employee role:', err);
  } finally {
    mainMenu();
  }
};

async function updateEmployeesManager(){
  try {
    const { rows: employees } = await pool.query('SELECT * FROM employee');
    const employeeChoices = employees.map(emp => ({ name: `${emp.first_name} ${emp.last_name}`, value: emp.id }));
    const managerChoices = [...employeeChoices, { name: 'None', value: null }];
    const answers = await inquirer.prompt([
      {
        type: 'list',
        name: 'employee_id',
        message: "Which employee would you like to update?",
        choices: employeeChoices
      },
      {
        type: 'list',
        name: 'manager_id',
        message: "Which manager do you want to assign the selected employee?",
        choices: managerChoices
      }
    ]);
    await pool.query('UPDATE employee SET manager_id = $1 WHERE id = $2', [answers.manager_id, answers.employee_id]);
    console.log('Employee manager updated successfully!');
  } catch (error) {
    console.error('Error updating employee manager:', error);
  }
  mainMenu()
};

async function viewEmployeesByManager() {
  try {
    const { rows: managers } = await pool.query(`
      SELECT DISTINCT 
      manager.id, 
      CONCAT(manager.first_name, ' ', manager.last_name) AS manager
      FROM employee
      JOIN employee AS manager 
        ON employee.manager_id = manager.id
    `);

    const managerChoices = managers.map(manager => ({
      name: manager.manager, value: manager.id
    }));

    const { managerId } = await inquirer.prompt([
      {
        type: 'list',
        name: 'managerId',
        message: 'Select a manager to view their employees:',
        choices: managerChoices
      }
    ]);

    const {rows} = await pool.query(
      `SELECT 
      employee.id,
      employee.first_name, employee.last_name
       FROM employee WHERE manager_id = $1`, [managerId]);

    console.table(rows);
  } catch (err) {
    console.error('Error viewing employees by manager:', err);
  } finally {
    mainMenu();
  }
};

const viewEmployeesByDepartment = async () => {
  try {
    const departmentsResult = await pool.query('SELECT id, name FROM department');
    const departments: Department[] = departmentsResult.rows;

    const departmentChoices = departments.map(department => ({
      name: department.name,
      value: department.id
    }));

    const { departmentId } = await inquirer.prompt([
      {
        type: 'list',
        name: 'departmentId',
        message: 'Select a department to view its employees:',
        choices: departmentChoices
      }
    ]);

    const result = await pool.query('SELECT * FROM employee WHERE role_id IN (SELECT id FROM role WHERE department_id = $1)', [departmentId]);
    console.table(result.rows);
  } catch (err) {
    console.error('Error viewing employees by department:', err);
  } finally {
    mainMenu();
  }
};

const deleteDepartment = async () => {
  try {
    const departmentsResult = await pool.query('SELECT id, name FROM department');
    const departments: Department[] = departmentsResult.rows;

    const departmentChoices = departments.map(department => ({
      name: department.name,
      value: department.id
    }));

    const { departmentId } = await inquirer.prompt([
      {
        type: 'list',
        name: 'departmentId',
        message: 'Select a department to delete:',
        choices: departmentChoices
      }
    ]);

    await pool.query('DELETE FROM department WHERE id = $1', [departmentId]);
    console.log('Department deleted successfully!');
  } catch (err) {
    console.error('Error deleting department:', err);
  } finally {
    mainMenu();
  }
};

const deleteRole = async () => {
  try {
    const rolesResult = await pool.query('SELECT id, title FROM role');
    const roles: Role[] = rolesResult.rows;

    const roleChoices = roles.map(role => ({
      name: role.title,
      value: role.id
    }));

    const { roleId } = await inquirer.prompt([
      {
        type: 'list',
        name: 'roleId',
        message: 'Select a role to delete:',
        choices: roleChoices
      }
    ]);

    await pool.query('DELETE FROM role WHERE id = $1', [roleId]);
    console.log('Role deleted successfully!');
  } catch (err) {
    console.error('Error deleting role:', err);
  } finally {
    mainMenu();
  }
};

const deleteEmployee = async () => {
  try {
    const employeesResult = await pool.query('SELECT id, first_name, last_name FROM employee');
    const employees: Employee[] = employeesResult.rows;

    const employeeChoices = employees.map(emp => ({
      name: `${emp.first_name} ${emp.last_name}`,
      value: emp.id
    }));

    const { employeeId } = await inquirer.prompt([
      {
        type: 'list',
        name: 'employeeId',
        message: 'Select an employee to delete:',
        choices: employeeChoices
      }
    ]);

    await pool.query('DELETE FROM employee WHERE id = $1', [employeeId]);
    console.log('Employee deleted successfully!');
  } catch (err) {
    console.error('Error deleting employee:', err);
  } finally {
    mainMenu();
  }
};
const viewTotalUtilizedBudget = async () => {
  try {
    const departmentsResult = await pool.query('SELECT id, name FROM department');
    const departments: Department[] = departmentsResult.rows;

    const departmentChoices = departments.map(department => ({
      name: department.name,
      value: department.id
    }));

    const { departmentId } = await inquirer.prompt([
      {
        type: 'list',
        name: 'departmentId',
        message: 'Select a department to view its total utilized budget:',
        choices: departmentChoices
      }
    ]);

    const result = await pool.query('SELECT SUM(role.salary) AS total_budget FROM employee JOIN role ON employee.role_id = role.id WHERE role.department_id = $1', [departmentId]);
    console.table(result.rows);
  } catch (err) {
    console.error('Error viewing total utilized budget of a department:', err);
  } finally {
    mainMenu();
  }
};

mainMenu();
