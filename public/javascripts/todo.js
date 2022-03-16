document.addEventListener('DOMContentLoaded', (e) => {
  let templates = {}
  let todolist;

  class TodoList {
    constructor(todos) {
      this.todos = todos;
      this.doneTodos = this._getDoneTodos()
      this.currentTodoId = null;
      this._formatDueDates()
      
      // Objects of due date keys and array of todos
      this.todosByDate = this._getTodosByDate(this.todos)
      this.todosByDateDone = this._getTodosByDate(this.doneTodos)

      // Track state of current selected list and its todo items
      this.currentSection = 'All Todos';
      this.selectedTodos = this.todos;

      this.renderMain()
    }

    _getTodosByDate(list) {
      let obj = {}
      list.forEach((todo, i) => {
        if (!obj[todo.due_date]) {
          obj[todo.due_date] = [todo]
        } else {
          obj[todo.due_date].push(todo)
        }
      });
      return obj;
    }

    _getNoDueDateTodos(list) {
      return list.filter(todo => !todo.month && !todo.year)
    }

    _getDoneTodos() {
      return this.todos.filter(todo => todo.completed)
    }

    // create a duedate key for each todo formatted {mm/yy}
    _formatDueDates() {
      this.todos = this.todos.reduce((result, todo, currentIndex) => {
        if (todo.month && todo.year) {
          todo['due_date'] = `${todo.month}/${todo.year.substr(2,2)}`
        } else {
          todo['due_date'] = `No Due Date`
        }
        result.push(todo)
        return result
        }, []);
    }

    // sorts due date keys
    _sortByDate(obj) {
      let keys = Object.keys(obj).sort(compareKeys)

      let sorted = keys.reduce((result, key) => {
        result[key] = obj[key];
        return result;
      }, {})

      return sorted;

      function compareKeys(key1, key2) {
        if (key1 === 'No Due Date' && key2 !=='No Due Date') {
          return -1;
        }
        if (key1 !=='No Due Date' && key2 === 'No Due Date') {
          return 1;
        }

        let [month1, year1] = key1.split('/')
        let [month2, year2] = key2.split('/')

        if (year1 < year2) {
          return -1;
        } else if (year1 > year2) {
          return 1;
        } else if (month1 < month2) {
          return -1;
        } else if (month1 > month2) {
          return 1;
        } else {
          return 0;
        }
      }

    }
    // sort completed todos to bottom of todo lists
    _sortByDone(list) {
      return list.sort(compareCompleted)

      function compareCompleted(todo1, todo2) {
        if (todo1.completed< todo2.completed) {
          return -1;
        } else if (todo1.completed> todo2.completed) {
          return 1;
        } else {
          return 0;
        }
      }
    }

    // if todos list was updated or modified, update each category of todos
    _updateAllLists() {
      this.doneTodos = this._getDoneTodos()
      this._formatDueDates()

      this.todosByDate = this._getTodosByDate(this.todos)
      this.todosByDateDone = this._getTodosByDate(this.doneTodos)
    }

    _removeTodo() {
      let idx = this._getTodoIndex(this.todos)
      this.todos.splice(idx, 1)

      idx = this._getTodoIndex(this.selectedTodos)
      this.selectedTodos.splice(idx, 1)
    }

    _getTodoIndex(list) {
      return list.findIndex(todo => todo.id === this.currentTodoId)
      }

    bindEvents() {
      this.form = document.querySelector('form')
      this.modalLayer = document.querySelector('#modal_layer')
      this.modal = document.querySelector('#form_modal')

      this.modal.addEventListener('submit', this.submitForm.bind(this));
      this.modalLayer.addEventListener('click', this.hideForm.bind(this));
      document.querySelector('label[for="new_item"]').addEventListener('click', this.renderForm.bind(this));
      document.querySelector('tbody').addEventListener('click', this.handleTableClick.bind(this));
      document.querySelector('button[name="complete"]').addEventListener('click', this.toggleTodoDone.bind(this));
      document.querySelector('#sidebar').addEventListener('click', this.showTodosGroup.bind(this));

    }

    showTodosGroup(e) {
      e.preventDefault();
      let all = document.querySelector('#all')
      let completed = document.querySelector('#completed_items')

      // exit handler if todo group was not clicked
      if ((!all.contains(e.target) && !completed.contains(e.target)) || e.target === all || e.target === completed ) {
        return;
      }

      let header = e.target.closest('header')
      let parent = header ? header : e.target.closest('dl')

      let title;
      let list;
      title = parent.dataset.title

      if (header && all.contains(e.target)) {
        list = this.todos
      } else if (header && completed.contains(e.target)) {
        list = this.doneTodos
      } else if (title === 'No Due Date' && all.contains(e.target)) {
        list = this._getNoDueDateTodos(this.todos)
      } else if (title === 'No Due Date' && completed.contains(e.target)) {
        list = this._getNoDueDateTodos(this.doneTodos)
      } else if (all.contains(e.target)) {
        list = this.todosByDate[title]
      } else {
        list = this.todosByDateDone[title]
      }

      this.currentSection = title;
      this.selectedTodos = list;

      this.renderMain()
    }

    renderMain() {
      // sort todo lists
      this.todosByDate = this._sortByDate(this.todosByDate)
      this.todosByDateDone = this._sortByDate(this.todosByDateDone)
      this.todos = this._sortByDone(this.todos)
      this.selectedTodos = this._sortByDone(this.selectedTodos)

      // create context data structures
      let section = {
        title: this.currentSection,
        data: this.selectedTodos.length
      }

      let context = {
        current_section: section,
        selected: this.selectedTodos,
        todos: this.todos,
        todos_by_date: this.todosByDate,
        done_todos_by_date: this.todosByDateDone,
        todos: { length: this.todos.length },
        done: { length: this.doneTodos.length }
      }
      let html = templates.main_template(context)
      document.body.innerHTML = ''
      document.body.insertAdjacentHTML('afterbegin', html)

      this.bindEvents();

    }

    handleTableClick(e) {
      e.preventDefault();
      this.currentTodoId = +e.target.closest('tr').dataset.id

      // delete todo when trash icon clicked
      if (e.target.nodeName === 'TD' && e.target.className === 'delete' || e.target.nodeName === 'IMG' && e.target.getAttribute('alt') === 'Delete') {

        fetch('/api/todos/' + this.currentTodoId, {
          method: 'DELETE',
        })
        .then((response) => {
          if (!response.ok) throw new Error(response)

          this._removeTodo()
          this._updateAllLists()
          this.renderMain();

        })
        .catch((err) => console.error(err))
      } else if (e.target.nodeName === 'LABEL') {
        this.renderForm(e)
      } else {
        this.toggleTodoDone()
      }
    }

    // reveals form to edit/add todo
    renderForm(e) {
      e.preventDefault();
      let addLink = document.querySelector('label[for="new_item"]')

      // show blank new todo form
      if (e.target.closest('label') === addLink) {
        this.currentTodoId = null;

      // prepopulate form with selected todo details
      } else {
        fetch('/api/todos/' + this.currentTodoId)
        .then(response => response.json())
        .then(data => {
          for (let key in data) {
            let element = this.form.querySelector('[name="'+ key + '"]')
            if (!element || !data[key]) continue;
            element.value = data[key]
          }
        }).catch(err => console.error(err))
      }
      this.showForm()

    }

    async submitForm(e) {
      e.preventDefault();

      let formData = new FormData(this.form)
      if (formData.get('title').length < 3) {
        alert('Title must be at least 3 characters long')
        return;
      }

      if (formData.get('day') === 'Day') formData.delete('day')
      if (formData.get('month') === 'Month') formData.delete('month')
      if (formData.get('year') === 'Year') formData.delete('year')
      if (formData.get('description') === '') formData.delete('description')

      let method;
      let url;

      if (this.currentTodoId) {
        method = 'PUT'
        url = `/api/todos/${this.currentTodoId}`
      } else {
        method = 'POST',
        url = `/api/todos/`
      }

      try {
        let response = await fetch(url, {
          method: method,
          headers: { 'Content-Type': 'application/json'},
          body: JSON.stringify(Object.fromEntries(formData))
        })
        if (!response.ok) throw new Error(response)
        let todo = await response.json()

        if (method === 'POST') {
          getTodos()
        } else {
          this._updateTodos(todo)
          this.renderMain()
        }

        this.hideForm()

      } catch (e) { console.error(e) }
    }

    // mark a todo done
    async toggleTodoDone() {
      let input = document.querySelector(`#item_${this.currentTodoId}`)

      if (!input) {
        alert('Cannot mark as complete as item has not been created yet!')
        return;
      }
      let status = input.checked ? false : true;

      try {
        let response = await fetch(`/api/todos/${this.currentTodoId}`, {
          method: 'PUT',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({'completed' : status})
        })
        let todo = await response.json();
        input.checked = todo.completed;

        this._updateTodos(todo);
        this.renderMain();
        if (this.modal.classList.contains('show')) this.hideForm()

      } catch (e) { console.error(e) }

    }

    showForm() {
      this.modalLayer.classList.add('show')
      this.modal.classList.add('show')
      this.modalLayer.classList.remove('hide')
      this.modal.classList.remove('hide')
    }

    hideForm() {
      this.form.reset()
      this.modalLayer.classList.remove('show')
      this.modal.classList.remove('show')
      this.modalLayer.classList.add('hide')
      this.modal.classList.add('hide')
      this.currentTodoId = null;

    }

    // replaces todolist and selected list with updated todo
    _updateTodos(newTodo) {
      let idx = this._getTodoIndex(this.todos)
      this.todos.splice(idx,1, newTodo)

      idx = this._getTodoIndex(this.selectedTodos)
      this.selectedTodos.splice(idx,1, newTodo)

      this._updateAllLists()
    }


  }

  async function getTodos() {
    try {
      let response = await fetch('/api/todos')
      let data = await response.json();

      todolist = new TodoList(data)
    } catch (e) {console.error(e) }

  }
  // MAIN
  compileAllTemplates()
  getTodos()

  // HELPER
  function compileAllTemplates() {
    document.querySelectorAll('script[type="text/x-handlebars"]').forEach(tmpl => {
      templates[tmpl.id] = Handlebars.compile(tmpl.innerHTML)
    })

    document.querySelectorAll('[data-type="partial"]').forEach(partial => {
      Handlebars.registerPartial(partial.id, templates[partial.id])
    })
  }''

});
