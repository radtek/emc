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
    
    public partial class TaskJobMap
    {
        public int MapId { get; set; }
        public int TaskId { get; set; }
        public int JobId { get; set; }
    
        public virtual AutomationTask AutomationTask { get; set; }
        public virtual AutomationJob AutomationJob { get; set; }
    }
}