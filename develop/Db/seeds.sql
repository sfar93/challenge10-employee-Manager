-- Populate Departments
INSERT INTO department (name) VALUES 
('Engineering'),
('Marketing'),
('Sales'),
('Human Resources');

-- Populate Roles
INSERT INTO role (title, salary, department_id) VALUES 
('Software Engineer', 100000, 1),
('Marketing Manager', 90000, 2),
 ('Sales Associate', 60000, 3),
('HR Specialist', 75000, 4);

-- Populate Employees
INSERT INTO employee (first_name, last_name, role_id, manager_id) VALUES
 ('John', 'Doe', 1, NULL),
('Jane', 'Smith', 2, NULL),
('Michael', 'Johnson', 3, NULL),
 ('Emily', 'Davis', 4, NULL),
 ('Sarah', 'Brown', 1, 1);
