let output=document.getElementById("parent");
let count=document.getElementById("count");
let feedbacks=JSON.parse(localStorage.getItem("feedbacks")) || [];
let categorySelect=document.getElementById("categorySelect");
count.textContent=feedbacks.length;
function displayfeedBacks(feedbacks){
 output.innerHTML="";
for(let i=0;i<feedbacks.length;i++){
    
    output.innerHTML+=`
      <div class="col-12 col-md-6 col-lg-4">
              <div class="card  h-100 p-3 border-0 shadow-sm">
                <div class="card-body p-0">
                  <div class="d-flex justify-content-between align-items-center mb-3">
                    <h6 class="fw-bold mb-0 text-dark">${feedbacks[i].userName}</h6>
                    <small class="text-muted">${feedbacks[i].date}</small>
                  </div>
                  <span class="badge badge-custom rounded-pill px-3 py-2 fw-normal mb-3">${feedbacks[i].category}</span>
                  <p class="card-text text-secondary mt-2">${feedbacks[i].subject}</p>
                </div>
              </div>
            </div>
    
    `
}
}
displayfeedBacks(feedbacks);
function filterFeedbacks(feedbacks, categorySelect) {
  if(categorySelect.value=="all"){
    displayfeedBacks(feedbacks);
  }
  else if(categorySelect.value=="suggestion"){
    displayfeedBacks(feedbacks.filter(feedback=>feedback.category.toLowerCase()==categorySelect.value.toLowerCase()));
  }
  else if(categorySelect.value=="Complaint"){
    displayfeedBacks(feedbacks.filter(feedback=>feedback.category.toLowerCase()==categorySelect.value.toLowerCase()));
  }
  else if(categorySelect.value=="Praise"){
    displayfeedBacks(feedbacks.filter(feedback=>feedback.category.toLowerCase()==categorySelect.value.toLowerCase()));
  }
  else if(categorySelect.value=="Other"){
    displayfeedBacks(feedbacks.filter(feedback=>feedback.category.toLowerCase()==categorySelect.value.toLowerCase()));
  }}

  categorySelect.addEventListener("click",()=>{filterFeedbacks(feedbacks ,categorySelect)});