//------------------------------------------------------------------------------
// <auto-generated>
//    This code was generated from a template.
//
//    Manual changes to this file may cause unexpected behavior in your application.
//    Manual changes to this file will be overwritten if the code is regenerated.
// </auto-generated>
//------------------------------------------------------------------------------

namespace Core.Model
{
    using System;
    using System.Collections.Generic;
    
    public partial class TestResult
    {
        public int ResultId { get; set; }
        public int ExecutionId { get; set; }
        public int Result { get; set; }
        public bool IsTriaged { get; set; }
        public Nullable<int> TriagedBy { get; set; }
        public string Files { get; set; }
        public string Description { get; set; }
    
        public virtual TestCaseExecution TestCaseExecution { get; set; }
        public virtual User User { get; set; }
    }
}