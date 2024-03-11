"use strict";
/* Aside & Navbar: dropdowns */
Array.from(document.getElementsByClassName('dropdown')).forEach(function (elA) {
  elA.addEventListener('click', function (e) {
    if (e.currentTarget.classList.contains('navbar-item')) {
      e.currentTarget.classList.toggle('active');
    } else {
      var dropdownIcon = e.currentTarget.getElementsByClassName('mdi')[1];
      e.currentTarget.parentNode.classList.toggle('active');
      dropdownIcon.classList.toggle('mdi-plus');
      dropdownIcon.classList.toggle('mdi-minus');
    }
  });
});
/* Aside Mobile toggle */

Array.from(document.getElementsByClassName('mobile-aside-button')).forEach(function (el) {
  el.addEventListener('click', function (e) {
    var dropdownIcon = e.currentTarget.getElementsByClassName('icon')[0].getElementsByClassName('mdi')[0];
    document.documentElement.classList.toggle('aside-mobile-expanded');
    dropdownIcon.classList.toggle('mdi-forwardburger');
    dropdownIcon.classList.toggle('mdi-backburger');
  });
});
/* NavBar menu mobile toggle */

Array.from(document.getElementsByClassName('--jb-navbar-menu-toggle')).forEach(function (el) {
  el.addEventListener('click', function (e) {
    var dropdownIcon = e.currentTarget.getElementsByClassName('icon')[0].getElementsByClassName('mdi')[0];
    document.getElementById(e.currentTarget.getAttribute('data-target')).classList.toggle('active');
    dropdownIcon.classList.toggle('mdi-dots-vertical');
    dropdownIcon.classList.toggle('mdi-close');
  });
});
/* Modal: open */

Array.from(document.getElementsByClassName('--jb-modal')).forEach(function (el) {
  el.addEventListener('click', function (e) {
    var modalTarget = e.currentTarget.getAttribute('data-target');
    document.getElementById(modalTarget).classList.add('active');
    document.documentElement.classList.add('clipped');
  });
});
/* Modal: close */

Array.from(document.getElementsByClassName('--jb-modal-close')).forEach(function (el) {
  el.addEventListener('click', function (e) {
    e.currentTarget.closest('.modal').classList.remove('active');
    document.documentElement.classList.remove('is-clipped');
  });
});
/* Notification dismiss */

Array.from(document.getElementsByClassName('--jb-notification-dismiss')).forEach(function (el) {
  el.addEventListener('click', function (e) {
    e.currentTarget.closest('.notification').classList.add('hidden');
  });
});

let confirmModal=null;
let productModal=null;
let categoryModal=null


// Define the confirmShow function
function confirmShow(item) {
  const element = document.getElementById("confirm-modal");
  const actionBtn=document.getElementById('action-btn');
  const actionText=document.getElementById('action-text');
  const actionId=document.getElementById('action-id');
  // const itemId = document.getElementById('id')
  // console.log('hello:',item.id);
  confirmModal = new bootstrap.Modal(element);
  let text=item.innerText
  actionText.innerText=text.toLowerCase();
  actionBtn.innerText=text;
  actionId.value=item.id;
  confirmModal.show();

}

function productList() {
  const itemId = document.getElementById('action-id').value;
  const actionText=document.getElementById('action-text');
  const action = actionText.innerText
  console.log(itemId);
  const element = document.getElementById('confirm-modal');
      const confirmModal = new bootstrap.Modal(element);
      confirmModal.hide();
      const endpoint = '/admin/updateProductList';

  // Make the fetch request
  fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ itemId,action }),
  })
    .then(response => response.json())
    .then(data => {
      console.log('Response from server:', data);
      // You can handle the response as needed (e.g., update UI, show a message)
      location.reload();
    })
    .catch(error => {
      console.error('Error:', error);
      // Handle errors, e.g., show an error message to the user
    })
    .finally(() => {
      // Close the modal after the request is complete (successful or not)
      
    });
}



async function customerBlock() {
  try {
    const actionId=document.getElementById('action-id');
    const item=document.getElementById(actionId.value)
    console.log(actionId.value);
    console.log(`/block-customer/${actionId.value}`)
    const rawData = await fetch(`/admin/block-customer/${actionId.value}`, {
      method: "PATCH",
    });
    if(rawData.status===401){
      window.location.href="/admin/login"
    }
    console.log(rawData.ok);
    if (rawData.ok) {
      const data = await rawData.json();
      item.classList.toggle("btn-danger");
      item.classList.toggle("btn-success");
      item.innerText = data.message;
      confirmModal.hide();

    }
  } catch (error) {
    console.error(error.message);
  }
}

async function addCategories(item){
  try {
    console.log(item);
    const addInput = document.getElementById('add-category');
    const categoryName = addInput.value.trim();
    console.log(categoryName);
    if(categoryName){

      const rawData = await fetch('/admin/add-categories',{
        method:"POST",
        body:JSON.stringify({categoryName:categoryName}),
        headers:{"Content-Type":"application/json"}
      })
        console.log(rawData);
        if(rawData.status===401){
            window.location.href="/admin"
        }

        if(rawData.ok){
          const alert = document.getElementById("category-alert");
          const data = await rawData.json();
          console.log(data);
          console.log(rawData.ok);
          if(data.status==="success"){
            addInput.value = "";
            const tableBody = document.getElementById("table-category");
            const tr = document.createElement("tr");
            console.log(data.result, data.result.name);
            tr.innerHTML = `<td data-name="${data.result._id}">${data.result.name}</td>
            <td class="justify-content-center d-flex">
            <button
              class="btn btn-list me-2 btn-danger btn-block"
              data-id="${data.result._id}"
              onclick="categoryList(this)" >
              Unlist
            </button>
            <button class="btn btn-dark" data-id="${data.result._id}" onclick="editCategories(this)">Edit</button>
          </td>`;
          tableBody.appendChild(tr);
          alert.innerText = "Category added";
          alert.style.visibility = "visible";
          alert.style.backgroundColor = "#77dd77";
          }else{
            alert.innerText = data.message;
            alert.style.backgroundColor = "#FAFA33";
            alert.style.visibility = "visible";
          }
           setTimeout(() => {
            alert.style.visibility = "hidden";
          }, 10000);
        }
    }else{
      addInput.value="";
    }
  } catch (error) {
    console.log(error.message); 
  }
}


//======================================

async function categoryList(item){
  try {
    const actionId=document.getElementById('action-id');
    const item=document.getElementById(actionId.value)
    const rawData = await fetch(`/admin/list-categories/${item.dataset.id}`, {
      method: "PATCH",
    });
    if(rawData.status===401){
      window.location.href="/admin/login"
    }
    if (rawData.ok) {
      const data = await rawData.json();
      item.classList.toggle("btn-danger");
      item.classList.toggle("btn-success");
      item.innerText = data.message;
      confirmModal.hide();
    }
  } catch (error) {
    console.log(error);
  }
}


// ===============================================


function removeWhiteSpace(item){
  const content = item.value;
  item.value = content.trim();
}

async function editCategories(item){
  const prevName = document.querySelector(`[data-name="${item.dataset.id}"]`).innerText;
  const element = document.getElementById("edit-category-modal");
  const name = document.getElementById("cat-name");
  const error = document.querySelector(".error-modal");
  categoryModal = new bootstrap.Modal(element);
  const catId = document.getElementById("cat-id");
  catId.value = item.dataset.id;
  name.value = prevName;
  error.innerText = "";
  categoryModal.show();
}


async function sendEditRequest(){
  try {
    const id = document.getElementById("cat-id").value;
    const name = document.getElementById("cat-name").value;
    const error = document.querySelector(".error-modal");
    const rawData = await fetch("/admin/edit-categories",{
      method:"PUT",
      body:JSON.stringify({id,name}),
      headers:{"Content-Type":"application/json"}

    })

    if(rawData.status===401){
      window.location.href="/admin"
    }

    if(rawData.ok){
      const data = await rawData.json();
      if(data.status ==="success"){
        const catName = document.querySelector(`[data-name="${id}"]`);
        catName.innerText = name;
        categoryModal.hide();
      }else{
        error.innerText = data.message
      }
    }
  } catch (error) {
    console.log(error.message);
  }
}
