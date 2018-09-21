// Whenever someone clicks a p tag
$(document).on("click", ".post-comment", function() {
  var postID = $(this).data("id");
  $.get("/articles/" + postID ,function(article){
    $(".modal-title").text(article.title);
    $(".post-btn").attr("data-id", article._id)
    $("#comment-modal").modal();
  })
 
});

// When you click the savenote button
$(document).on("click", ".delete", function() {
  var deleteID = $(this).data("id")
  console.log("Delete")
  $.ajax({
    method: "DELETE",
    url: "/articles/"+ deleteID
  }).done(function(){
    window.location.reload();
  });
});

$(document).on("click", ".post-btn", function(event){
  event.preventDefault();
  var postingID = $(this).data("id");

  var userInput = $("#user-input").val().trim();
  var commentInput =  $("#comment-input").val().trim();

  var newComment = {
    user: userInput,
    body: commentInput
  }

  console.log(newComment)

  $.post("/articles/" + postingID, newComment, function(result){
    window.location.reload();
  });

});
