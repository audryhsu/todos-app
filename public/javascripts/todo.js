let FORM;
document.addEventListener('DOMContentLoaded', (e) => {
  let templates = {}
  let todolist;

  class TodoList {
    constructor(todos) {
      this.todos = todos;
      // array of section titles ['no due date', 'mm/yy', 'completed']
      this.sections = ['All Todos', 'Completed', 'No Due Date'];

      // extract these from todos and looping through sections?
      this.doneTodos;
      this.todosByDate;
      this.todosNoDate; //not sure if i need this

      // Track state of current selected list and its itemse
      this.currentSection = this.sections[0];
      this.selectedTodos = this.todos; // initialze to all todos

      //dynamically created elements
      this.renderMain()
      this.modalLayer = document.querySelector('#modal_layer')
      this.form = document.querySelector('#form_modal')
      this.table = document.querySelector('tbody')

      this.bindEvents()

    }

    bindEvents() {
      this.modalLayer.addEventListener('click', this.hideForm.bind(this));
      document.querySelector('label[for="new_item"]').addEventListener('click', this.renderForm.bind(this));
      this.table.addEventListener('click', this.handleTableClick.bind(this));
      // todo: add a renderForm EL on the table

    }

    handleTableClick(e) {
      e.preventDefault();

      if (e.target.nodeName === 'TD' && e.target.className === 'delete') {
        let id = e.target.closest('tr').dataset.id
        console.log(id);
        console.log('delete button clicked!');

        fetch('/api/todos/' + id, {
          method: 'DELETE',
        })
        .then((response) => {
          if (!response.ok) throw new Error(response)
          alert('Todo was deleted successfully!')
          getTodos()
        })
        .catch((err) => console.error(err))

      }
    }

    async addNewTodo(e) {
      e.preventDefault();
      // console.log(e.target.nodeName + ' was clicked!');
      let form = document.querySelector('form')

      let formData = new FormData(form)

      if (formData.get('day') === 'Day') formData.delete('day')
      if (formData.get('month') === 'Month') formData.delete('month')
      if (formData.get('year') === 'Year') formData.delete('year')
      if (formData.get('description') === '') formData.delete('description')

      // console.log('== json data to submit ==');
      // console.log(JSON.stringify(Object.fromEntries(formData)));
      try {
        let response = await fetch('/api/todos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json'},
          body: JSON.stringify(Object.fromEntries(formData))
        })
        let data = await response.json()
        this.hideForm()
        getTodos() // ned the new todo to be wired into the delete event listener
        // this.renderMain()
      } catch (e) {
        console.error(e);
      }

    }
    // // TODO: reveal form prepopulated
    updateTodo(e, id) {
      e.preventDefault();
      console.log(...arguments);
      let form = document.querySelector('form')
      let formData = new FormData(form)

      if (formData.get('day') === 'Day') formData.delete('day')
      if (formData.get('month') === 'Month') formData.delete('month')
      if (formData.get('year') === 'Year') formData.delete('year')
      if (formData.get('description') === '') formData.delete('description')

      FORM= form;
      console.log('== json data to update todo  ==');
      console.log(JSON.stringify(Object.fromEntries(formData)));
      // try {
      //   let response = await fetch('/api/todos', {
      //     method: 'POST',
      //     headers: { 'Content-Type': 'application/json'},
      //     body: JSON.stringify(Object.fromEntries(formData))
      //   })
      //   let data = await response.json()
      //   todolist.todos.push(data)
      //   todolist.hideForm()
      //   todolist.renderMain()
      //   }
      // } catch (e) {
      //   console.error(e);
      // }


    }

    // reveals form
    renderForm(e) {
      e.preventDefault();
      console.log(e.target.nodeName + 'was clicked!');
      let addLink = document.querySelector('label[for="new_item"]')

      if (e.target.closest('label') === addLink) {
        console.log('add a new todo rendered the modal! ');

        this.form.addEventListener('submit', this.addNewTodo.bind(this));

      } else {
        let tr = e.target.closest('tr')
        let id = tr.getAttribute('data-id')

        this.form.addEventListener('submit', this.updateTodo.bind(this));
      }

      this.showForm()

    }

    showForm() {
      this.modalLayer.classList.add('show')
      this.form.classList.add('show')


      this.modalLayer.classList.remove('hide')
      this.form.classList.remove('hide')
    }
    hideForm() {
      this.modalLayer.classList.remove('show')
      this.form.classList.remove('show')
      this.modalLayer.classList.add('hide')
      this.form.classList.add('hide')

    }

    //creates context for main_template to render the DOM
    renderMain() {
      let section = {
        title: this.currentSection,
        data: this.selectedTodos.length
      }

      let context = {
        current_section: section,
        selected: this.selectedTodos
      }
      // TODO: initialze sidebar context
      // console.log('context', context);
      let html = templates.main_template(context)
      document.body.innerHTML = ''
      document.body.insertAdjacentHTML('afterbegin', html)

    }

    // end TLodolist methods
  }

  async function getTodos() {
    try {
      let response = await fetch('/api/todos')
      let data = await response.json();
      console.log('loaded todos:', data);

      todolist = new TodoList(data)

    } catch (e) {
      console.error(e);
    }

  }
  // MAIN HERE
  compileAllTemplates()
  getTodos()



  // compile templates
  function compileAllTemplates() {
    document.querySelectorAll('script[type="text/x-handlebars"]').forEach(tmpl => {
      templates[tmpl.id] = Handlebars.compile(tmpl.innerHTML)
    })

    document.querySelectorAll('[data-type="partial"]').forEach(partial => {
      Handlebars.registerPartial(partial.id, templates[partial.id])
    })
  }

});
